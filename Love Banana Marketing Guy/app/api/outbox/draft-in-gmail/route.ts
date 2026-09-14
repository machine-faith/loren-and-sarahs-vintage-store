import { NextResponse, NextRequest } from 'next/server';
import { getStore } from '@/lib/db';
import { createBatchDraftsInGmail, DraftTarget } from '@/lib/gmail';
import { evaluateStageAdvancement } from '@/lib/dispatch-state';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { outboxIds, channel, secondaryGmailUser, secondaryGmailAppPassword } = body;

    // Check cookie fallback if secondary credentials were not passed in body
    const cookieHeader = request.cookies.get('lb_crm_settings')?.value;
    if (cookieHeader) {
      try {
        let parsed: any = null;
        try {
          parsed = JSON.parse(decodeURIComponent(cookieHeader));
        } catch {
          parsed = JSON.parse(cookieHeader);
        }
        if (parsed && typeof parsed === 'object') {
          if (!secondaryGmailUser && parsed.secondaryGmailUser) secondaryGmailUser = parsed.secondaryGmailUser;
          if (!secondaryGmailAppPassword && parsed.secondaryGmailAppPassword) secondaryGmailAppPassword = parsed.secondaryGmailAppPassword;
          if (!channel && parsed.activeGmailAccount) channel = parsed.activeGmailAccount;
        }
      } catch (e) {}
    }

    if (!Array.isArray(outboxIds) || outboxIds.length === 0) {
      return NextResponse.json({ error: 'outboxIds array required' }, { status: 400 });
    }

    const store = getStore();
    let settings = store.getSettings();

    // If client or cookie supplied secondary credentials, persist immediately and ensure simulationMode is disabled if password present
    if (secondaryGmailUser) {
      settings = store.updateSettings({
        secondaryGmailUser,
        secondaryGmailAppPassword: secondaryGmailAppPassword || settings.secondaryGmailAppPassword || '',
        activeGmailAccount: channel || 'secondary',
        simulationMode: (secondaryGmailAppPassword || settings.secondaryGmailAppPassword) ? 'false' : settings.simulationMode
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

    if (targets.length > 0 && successCount === 0 && !batchRes.simulated) {
      const firstErr = batchRes.results.find(r => r.error)?.error || 'Failed to append drafts to Gmail. Please verify your Gmail App Password.';
      return NextResponse.json({
        error: firstErr,
        results: batchRes.results
      }, { status: 400 });
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
