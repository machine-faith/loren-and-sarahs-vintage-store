import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { createBatchDraftsInGmail, DraftTarget } from '@/lib/gmail';
import { evaluateStageAdvancement } from '@/lib/dispatch-state';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { outboxIds, channel, secondaryGmailUser, secondaryGmailAppPassword } = body;

    if (!Array.isArray(outboxIds) || outboxIds.length === 0) {
      return NextResponse.json({ error: 'outboxIds array required' }, { status: 400 });
    }

    const store = getStore();
    let settings = store.getSettings();

    // If client supplied secondary credentials and server is missing them, persist immediately
    if (secondaryGmailUser && (!settings.secondaryGmailUser || !settings.secondaryGmailAppPassword)) {
      settings = store.updateSettings({
        secondaryGmailUser,
        secondaryGmailAppPassword: secondaryGmailAppPassword || settings.secondaryGmailAppPassword || '',
        activeGmailAccount: channel || 'secondary'
      });
    }

    // Evaluate warmup stage advancement for informational status
    let state = store.getDispatchState();
    state = evaluateStageAdvancement(state);
    store.updateDispatchState(state);

    const targetChannel: 'primary' | 'secondary' = channel || (settings.activeGmailAccount as 'primary' | 'secondary') || (settings.secondaryGmailUser ? 'secondary' : 'primary');

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

    // Update last batch start timestamp
    store.updateDispatchState({ last_batch_start_time: new Date().toISOString() });

    const batchRes = await createBatchDraftsInGmail(targets, targetChannel);

    let successCount = 0;
    for (const r of batchRes.results) {
      if (r.id && r.success && validMap[r.id]) {
        successCount++;
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
      draftedCount: successCount,
      simulated: batchRes.simulated,
      accountUsed: batchRes.accountUsed,
      results: batchRes.results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
