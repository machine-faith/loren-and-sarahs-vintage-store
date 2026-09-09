import { google } from 'googleapis';
import tls from 'tls';
import { getStore } from './db';

function getOAuth2Client(redirectUri?: string) {
  const store = getStore();
  const settings = store.getSettings();

  const clientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = settings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = redirectUri || 'http://localhost:3000/api/auth/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    callbackUrl
  );

  if (settings.googleRefreshToken) {
    oauth2Client.setCredentials({
      refresh_token: settings.googleRefreshToken
    });
  }

  return oauth2Client;
}

export function getGoogleAuthUrl(redirectUri?: string): string | null {
  const oauth2Client = getOAuth2Client(redirectUri);
  if (!oauth2Client) return null;

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });
}

export async function handleAuthCallback(code: string, redirectUri?: string) {
  const oauth2Client = getOAuth2Client(redirectUri);
  if (!oauth2Client) throw new Error('Google OAuth credentials not configured');

  const { tokens } = await oauth2Client.getToken(code);
  const store = getStore();

  if (tokens.refresh_token) {
    store.updateSettings({
      googleRefreshToken: tokens.refresh_token,
      simulationMode: 'false'
    });
  }

  return tokens;
}

function makeRawEmail(to: string, from: string, subject: string, bodyText: string, threadId?: string): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
  ];

  if (threadId) {
    messageParts.push(`In-Reply-To: ${threadId}`);
    messageParts.push(`References: ${threadId}`);
  }

  messageParts.push('', bodyText);
  const message = messageParts.join('\r\n');
  return Buffer.from(message).toString('base64url');
}

import nodemailer from 'nodemailer';

export function getActiveGmailAccount(settings: any) {
  const isSecondary = settings.activeGmailAccount === 'secondary';
  const primaryUser = (settings.gmailUser || settings.fromEmail || 'lovebananaband@gmail.com').trim();
  const primaryPass = (settings.gmailAppPassword || '').trim();

  if (isSecondary) {
    const user = (settings.secondaryGmailUser || settings.secondaryFromEmail || '').trim();
    const pass = (settings.secondaryGmailAppPassword || '').trim();
    // Even if no separate App Password exists, we can relay through the primary account with Reply-To
    const hasRelayAuth = Boolean(primaryUser && primaryPass);
    return {
      id: 'secondary' as const,
      label: settings.secondaryAccountLabel || 'Henry (Outreach / Alias)',
      userEmail: user || primaryUser,
      appPassword: pass,
      relayUser: primaryUser,
      relayPass: primaryPass,
      senderName: settings.secondaryContactName || settings.contactName || settings.bandName || 'Henry Collins',
      fromEmail: settings.secondaryFromEmail || user || primaryUser,
      replyToEmail: settings.replyToEmail || user || undefined,
      isConnected: Boolean(pass || (user && hasRelayAuth) || hasRelayAuth),
      isRelayMode: Boolean(!pass && hasRelayAuth)
    };
  }

  return {
    id: 'primary' as const,
    label: settings.primaryAccountLabel || 'Main Account (Love Banana)',
    userEmail: primaryUser,
    appPassword: primaryPass,
    relayUser: primaryUser,
    relayPass: primaryPass,
    senderName: settings.contactName || settings.bandName || 'Henry Collins',
    fromEmail: settings.fromEmail || primaryUser,
    replyToEmail: settings.replyToEmail || undefined,
    isConnected: Boolean(primaryUser && primaryPass),
    isRelayMode: false
  };
}

export async function sendEmail({
  to,
  subject,
  body,
  threadId
}: {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}) {
  const store = getStore();
  const settings = store.getSettings();
  const activeAccount = getActiveGmailAccount(settings);

  // 1. If active Gmail App Password is configured, use it directly!
  // If secondary has no App Password (business account lock), relay securely through primary with Reply-To!
  const authUser = activeAccount.appPassword ? activeAccount.userEmail : (activeAccount.relayUser || settings.gmailUser);
  const authPass = activeAccount.appPassword ? activeAccount.appPassword : (activeAccount.relayPass || settings.gmailAppPassword);

  if (authPass && settings.simulationMode !== 'true') {
    const cleanPass = authPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: authUser,
        pass: cleanPass
      }
    });

    // If active account has a custom from/alias, use it; otherwise use authUser
    const fromAddress = activeAccount.fromEmail || authUser;
    const replyTo = activeAccount.replyToEmail || settings.replyToEmail || undefined;

    const mailOptions: any = {
      from: `"${activeAccount.senderName}" <${fromAddress}>`,
      to,
      subject,
      text: body
    };

    if (replyTo && replyTo !== fromAddress) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
      threadId: threadId || info.messageId,
      sentFrom: fromAddress,
      replyTo: replyTo || fromAddress,
      accountId: activeAccount.id,
      relay: activeAccount.isRelayMode
    };
  }

  // 2. If Google OAuth is configured, use Gmail API
  if (settings.googleRefreshToken && settings.simulationMode !== 'true') {
    const oauth2Client = getOAuth2Client();
    if (oauth2Client) {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const raw = makeRawEmail(to, settings.fromEmail || 'me', subject, body, threadId);

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId: threadId || undefined
        }
      });

      return {
        success: true,
        simulated: false,
        messageId: res.data.id,
        threadId: res.data.threadId
      };
    }
  }

  // 3. Fallback: Safe Simulation mode
  await new Promise(r => setTimeout(r, 600)); // simulated realistic latency
  return {
    success: true,
    simulated: true,
    messageId: `sim-msg-${Date.now()}`,
    threadId: threadId || `sim-thread-${Date.now()}`
  };
}

export interface DraftTarget {
  id?: string;
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
}

export interface DraftResult {
  id?: string;
  success: boolean;
  draftId?: string;
  error?: string;
}

export async function appendBatchDraftsImap({
  user,
  pass,
  drafts,
  fromName,
  fromEmail,
  replyTo
}: {
  user: string;
  pass: string;
  drafts: DraftTarget[];
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}): Promise<DraftResult[]> {
  if (!drafts.length) return [];

  const cleanPass = pass.replace(/\s+/g, '');
  const senderEmail = fromEmail || user;
  const senderDisplayName = fromName || 'Henry Collins';

  return new Promise((resolve) => {
    const socket = tls.connect({ host: 'imap.gmail.com', port: 993, rejectUnauthorized: false });
    socket.setEncoding('utf8');

    let buffer = '';
    let cmdIndex = 1;
    let currentDraftIndex = 0;
    let state: 'WAIT_GREETING' | 'LOGGING_IN' | 'WAIT_APPEND_PROMPT' | 'WAIT_APPEND_RESULT' | 'LOGGING_OUT' = 'WAIT_GREETING';
    const results: DraftResult[] = [];

    const timeout = setTimeout(() => {
      socket.destroy();
      for (let i = currentDraftIndex; i < drafts.length; i++) {
        results.push({ id: drafts[i].id, success: false, error: 'IMAP connection timed out' });
      }
      resolve(results);
    }, 35000);

    const cleanup = (err?: Error) => {
      clearTimeout(timeout);
      socket.destroy();
      if (err) {
        for (let i = currentDraftIndex; i < drafts.length; i++) {
          results.push({ id: drafts[i].id, success: false, error: err.message });
        }
      }
      resolve(results);
    };

    socket.on('data', (chunk) => {
      buffer += chunk;

      if (state === 'WAIT_GREETING' && buffer.includes('* OK')) {
        buffer = '';
        state = 'LOGGING_IN';
        socket.write(`A${cmdIndex++} LOGIN "${user}" "${cleanPass}"\r\n`);
      } else if (state === 'LOGGING_IN') {
        if (buffer.includes('OK') && buffer.includes('authenticated')) {
          buffer = '';
          startNextDraft();
        } else if (buffer.includes('NO') || buffer.includes('BAD')) {
          cleanup(new Error(`IMAP Login failed for ${user}: ${buffer.trim()}`));
        }
      } else if (state === 'WAIT_APPEND_PROMPT') {
        if (buffer.includes('+')) {
          buffer = '';
          state = 'WAIT_APPEND_RESULT';
          const draft = drafts[currentDraftIndex];
          const rawMessage = buildMime(draft);
          socket.write(rawMessage + '\r\n');
        } else if (buffer.includes('NO') || buffer.includes('BAD')) {
          results.push({ id: drafts[currentDraftIndex].id, success: false, error: buffer.trim() });
          currentDraftIndex++;
          buffer = '';
          startNextDraft();
        }
      } else if (state === 'WAIT_APPEND_RESULT') {
        const tag = `A${cmdIndex - 1}`;
        if (buffer.includes(`${tag} OK`)) {
          const match = buffer.match(/APPENDUID\s+\d+\s+(\d+)/);
          const uid = match ? match[1] : `draft-${Date.now()}`;
          results.push({ id: drafts[currentDraftIndex].id, success: true, draftId: uid });
          currentDraftIndex++;
          buffer = '';
          startNextDraft();
        } else if (buffer.includes(`${tag} NO`) || buffer.includes(`${tag} BAD`)) {
          results.push({ id: drafts[currentDraftIndex].id, success: false, error: buffer.trim() });
          currentDraftIndex++;
          buffer = '';
          startNextDraft();
        }
      } else if (state === 'LOGGING_OUT') {
        clearTimeout(timeout);
        socket.end();
        resolve(results);
      }
    });

    function startNextDraft() {
      if (currentDraftIndex < drafts.length) {
        state = 'WAIT_APPEND_PROMPT';
        const draft = drafts[currentDraftIndex];
        const rawMessage = buildMime(draft);
        const byteLen = Buffer.byteLength(rawMessage, 'utf8');
        socket.write(`A${cmdIndex++} APPEND "[Gmail]/Drafts" (\\Draft) {${byteLen}}\r\n`);
      } else {
        state = 'LOGGING_OUT';
        socket.write(`A${cmdIndex++} LOGOUT\r\n`);
      }
    }

    function buildMime(d: DraftTarget) {
      const utf8Subject = `=?utf-8?B?${Buffer.from(d.subject).toString('base64')}?=`;
      const dateStr = new Date().toUTCString();
      const msgId = `<lb-draft-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@gmail.com>`;
      const headers = [
        `From: "${senderDisplayName}" <${senderEmail}>`,
        `To: ${d.to}`,
        `Subject: ${utf8Subject}`,
        `Date: ${dateStr}`,
        `Message-ID: ${msgId}`,
      ];
      if (replyTo && replyTo !== senderEmail) {
        headers.push(`Reply-To: ${replyTo}`);
      }
      headers.push(
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        ``,
        d.body
      );
      return headers.join('\r\n');
    }

    socket.on('error', (err) => cleanup(err));
  });
}

export async function createBatchDraftsInGmail(
  drafts: DraftTarget[],
  targetAccount?: 'primary' | 'secondary'
): Promise<{
  success: boolean;
  simulated: boolean;
  results: DraftResult[];
  accountUsed?: {
    id: 'primary' | 'secondary';
    userEmail: string;
    isSeparateAccount: boolean;
  };
}> {
  const store = getStore();
  const settings = store.getSettings();
  const accountId = targetAccount || settings.activeGmailAccount || 'primary';
  const activeAccount = getActiveGmailAccount({ ...settings, activeGmailAccount: accountId });

  const authUser = activeAccount.appPassword ? activeAccount.userEmail : (activeAccount.relayUser || settings.gmailUser);
  const authPass = activeAccount.appPassword ? activeAccount.appPassword : (activeAccount.relayPass || settings.gmailAppPassword);

  // 1. If active Gmail App Password is configured and simulation mode is off, use real IMAP Append
  if (authPass && settings.simulationMode !== 'true') {
    const imapResults = await appendBatchDraftsImap({
      user: authUser,
      pass: authPass,
      drafts,
      fromName: activeAccount.senderName,
      fromEmail: activeAccount.fromEmail,
      replyTo: activeAccount.replyToEmail
    });
    return {
      success: true,
      simulated: false,
      results: imapResults,
      accountUsed: {
        id: activeAccount.id,
        userEmail: authUser,
        isSeparateAccount: Boolean(activeAccount.id === 'secondary' && activeAccount.appPassword)
      }
    };
  }

  // 2. If Google OAuth is configured, use Gmail API
  if (settings.googleRefreshToken && settings.simulationMode !== 'true') {
    const oauth2Client = getOAuth2Client();
    if (oauth2Client) {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const results: DraftResult[] = [];
      for (const d of drafts) {
        try {
          const raw = makeRawEmail(d.to, settings.fromEmail || 'me', d.subject, d.body);
          const res = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: { message: { raw } }
          });
          results.push({ id: d.id, success: true, draftId: res.data.id || undefined });
        } catch (err: any) {
          results.push({ id: d.id, success: false, error: err.message });
        }
      }
      return { success: true, simulated: false, results };
    }
  }

  // 3. Fallback: Safe Simulation mode
  await new Promise(r => setTimeout(r, 400));
  return {
    success: true,
    simulated: true,
    results: drafts.map(d => ({
      id: d.id,
      success: true,
      draftId: `sim-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      error: undefined
    }))
  };
}

export async function createDraftInGmail({
  to,
  subject,
  body,
  targetAccount
}: {
  to: string;
  subject: string;
  body: string;
  targetAccount?: 'primary' | 'secondary';
}) {
  const batchRes = await createBatchDraftsInGmail([{ to, subject, body }], targetAccount);
  const first = batchRes.results[0];
  if (!first || !first.success) {
    throw new Error(first?.error || 'Failed to create draft in Gmail');
  }
  return {
    success: true,
    simulated: batchRes.simulated,
    draftId: first.draftId,
    accountUsed: batchRes.accountUsed
  };
}

export async function syncReplies() {
  const store = getStore();
  const settings = store.getSettings();
  const outbox = store.getOutbox().filter(o => o.status === 'sent' && o.gmail_thread_id);

  if (settings.simulationMode === 'true' || !settings.googleRefreshToken) {
    // In simulation mode, check if we have any mock reply triggers or return current state
    return {
      syncedCount: outbox.length,
      newReplies: 0,
      simulated: true
    };
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return { syncedCount: 0, newReplies: 0 };

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  let newReplies = 0;

  for (const item of outbox) {
    if (!item.gmail_thread_id) continue;

    try {
      const threadRes = await gmail.users.threads.get({
        userId: 'me',
        id: item.gmail_thread_id,
        format: 'metadata'
      });

      const messages = threadRes.data.messages || [];
      if (messages.length > 1) {
        // Look at the latest message
        const lastMsg = messages[messages.length - 1];
        const headers = lastMsg.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
        
        // If not from our own email address, it's an inbound reply!
        if (fromHeader && !fromHeader.includes(settings.fromEmail)) {
          // Check if already stored
          const existingReplies = store.getReplies();
          const alreadyRecorded = existingReplies.some(r => r.gmail_thread_id === item.gmail_thread_id);

          if (!alreadyRecorded) {
            const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || item.subject;
            const contact = store.getContactById(item.contact_id);

            store.addReply({
              contact_id: item.contact_id,
              gmail_thread_id: item.gmail_thread_id,
              from_email: fromHeader,
              from_name: contact?.name || fromHeader,
              subject: subjectHeader,
              snippet: lastMsg.snippet || 'Incoming reply received',
              body: lastMsg.snippet || '',
              received_at: new Date(Number(lastMsg.internalDate) || Date.now()).toISOString(),
              is_read: false
            });

            newReplies++;
          }
        }
      }
    } catch (err) {
      console.error(`Error checking thread ${item.gmail_thread_id}:`, err);
    }
  }

  return {
    syncedCount: outbox.length,
    newReplies,
    simulated: false
  };
}
