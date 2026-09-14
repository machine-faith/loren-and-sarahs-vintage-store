import { NextResponse, NextRequest } from 'next/server';
import { getStore } from '@/lib/db';
import { createBatchDraftsInGmail, DraftTarget } from '@/lib/gmail';
import { evaluateStageAdvancement } from '@/lib/dispatch-state';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function parseCookiePayload(raw: string | undefined): any {
  if (!raw) return null;
  let val = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
    try {
      val = decodeURIComponent(val);
    } catch {
      break;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { outboxIds, drafts, channel, secondaryGmailUser, secondaryGmailAppPassword, gmailUser, gmailAppPassword } = body;

    // Check cookie fallback if credentials were not passed in body
    const cookieHeader = request.cookies.get('lb_crm_settings')?.value;
    const cookieSettings = parseCookiePayload(cookieHeader);
    if (cookieSettings && typeof cookieSettings === 'object') {
      if (!secondaryGmailUser && cookieSettings.secondaryGmailUser) secondaryGmailUser = cookieSettings.secondaryGmailUser;
      if (!secondaryGmailAppPassword && cookieSettings.secondaryGmailAppPassword) secondaryGmailAppPassword = cookieSettings.secondaryGmailAppPassword;
      if (!gmailUser && cookieSettings.gmailUser) gmailUser = cookieSettings.gmailUser;
      if (!gmailAppPassword && cookieSettings.gmailAppPassword) gmailAppPassword = cookieSettings.gmailAppPassword;
      if (!channel && cookieSettings.activeGmailAccount) channel = cookieSettings.activeGmailAccount;
    }

    const store = getStore();
    let settings = store.getSettings();

    // Ensure store has the latest in-flight credentials for both channels
    const updates: Partial<typeof settings> = {};
    if (gmailUser) updates.gmailUser = gmailUser;
    if (gmailAppPassword) updates.gmailAppPassword = gmailAppPassword;
    if (secondaryGmailUser) updates.secondaryGmailUser = secondaryGmailUser;
    if (secondaryGmailAppPassword !== undefined) updates.secondaryGmailAppPassword = secondaryGmailAppPassword;
    if (channel) updates.activeGmailAccount = channel;
    if (gmailAppPassword || secondaryGmailAppPassword || settings.gmailAppPassword || settings.secondaryGmailAppPassword) {
      updates.simulationMode = 'false';
    }
    if (Object.keys(updates).length > 0) {
      settings = store.updateSettings(updates);
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
    const validMap: Record<string, { outboxId?: string; contactId?: string }> = {};

    // 1. Direct stateless drafts payload (preferred — immune to serverless cold starts)
    if (Array.isArray(drafts) && drafts.length > 0) {
      for (const d of drafts) {
        if (!d.to || !d.subject || !d.body) continue;
        const targetId = d.id || d.contactId || `d-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        targets.push({
          id: targetId,
          to: d.to,
          subject: d.subject,
          body: d.body
        });
        validMap[targetId] = { outboxId: d.id, contactId: d.contactId };
      }
    } else if (Array.isArray(outboxIds) && outboxIds.length > 0) {
      // 2. Legacy outbox ID store lookup fallback
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
    } else {
      return NextResponse.json({ error: 'drafts array or outboxIds array required' }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({
        error: 'No valid draft targets found. Recipients, subjects, and bodies must not be empty.',
        results: []
      }, { status: 400 });
    }

    // Update last batch start timestamp
    store.updateDispatchState({ last_batch_start_time: new Date().toISOString() });

    const batchRes = await createBatchDraftsInGmail(targets, targetChannel);

    let successCount = 0;
    for (const r of batchRes.results) {
      if (r.id && r.success) {
        successCount++;
        const mapping = validMap[r.id];
        if (mapping?.outboxId) {
          store.updateOutboxItem(mapping.outboxId, {
            gmail_draft_id: r.draftId || null,
            status: 'approved'
          });
        }
        if (mapping?.contactId) {
          store.updateContact(mapping.contactId, {
            stage: 'awaiting_approval'
          });
        }
      }
    }

    if (targets.length > 0 && successCount === 0) {
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
