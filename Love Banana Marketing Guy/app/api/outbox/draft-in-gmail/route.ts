import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { createBatchDraftsInGmail, DraftTarget } from '@/lib/gmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { outboxIds, channel } = body;

    if (!Array.isArray(outboxIds) || outboxIds.length === 0) {
      return NextResponse.json({ error: 'outboxIds array required' }, { status: 400 });
    }

    const store = getStore();
    const settings = store.getSettings();
    const targetChannel: 'primary' | 'secondary' = channel || (settings.activeGmailAccount === 'primary' ? 'secondary' : 'secondary');

    // Protect lovebananaband@gmail.com by verifying secondary account config
    if (targetChannel === 'secondary' && !settings.secondaryGmailUser) {
      return NextResponse.json({
        error: 'Channel 2 (Outreach Email) is not linked yet. Please configure your separate outreach Gmail in Settings so automated radio and press pitches do not touch lovebananaband@gmail.com.',
        needsConfig: true
      }, { status: 400 });
    }

    const targets: DraftTarget[] = [];
    const validMap: Record<string, { outboxId: string; contactId: string }> = {};

    for (const outboxId of outboxIds) {
      const item = store.getOutboxItem(outboxId);
      if (!item) continue;
      const contact = store.getContactById(item.contact_id);
      if (!contact || !contact.email) continue;

      targets.push({
        id: outboxId,
        to: contact.email,
        subject: item.subject,
        body: item.body
      });
      validMap[outboxId] = { outboxId, contactId: contact.id };
    }

    const batchRes = await createBatchDraftsInGmail(targets, targetChannel);

    for (const r of batchRes.results) {
      if (r.id && r.success && validMap[r.id]) {
        store.updateOutboxItem(validMap[r.id].outboxId, {
          gmail_draft_id: r.draftId || null,
          status: 'approved'
        });
        store.updateContact(validMap[r.id].contactId, {
          stage: 'awaiting_approval'
        });
      }
    }

    return NextResponse.json({
      success: true,
      draftedCount: batchRes.results.filter(r => r.success).length,
      simulated: batchRes.simulated,
      accountUsed: batchRes.accountUsed,
      results: batchRes.results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
