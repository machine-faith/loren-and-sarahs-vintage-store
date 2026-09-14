import { NextResponse, NextRequest } from 'next/server';
import { getStore } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const store = getStore();
    let settings = store.getSettings();

    // Check cookie for persistent credentials (preserves credentials across all Vercel cold restarts)
    const cookieHeader = request.cookies.get('lb_crm_settings')?.value;
    if (cookieHeader) {
      try {
        let cookieSettings: any = null;
        try {
          cookieSettings = JSON.parse(decodeURIComponent(cookieHeader));
        } catch {
          cookieSettings = JSON.parse(cookieHeader);
        }

        if (cookieSettings && typeof cookieSettings === 'object') {
          const merged = {
            ...settings,
            ...cookieSettings,
            secondaryGmailUser: cookieSettings.secondaryGmailUser || settings.secondaryGmailUser,
            secondaryGmailAppPassword: cookieSettings.secondaryGmailAppPassword || settings.secondaryGmailAppPassword,
            activeGmailAccount: cookieSettings.activeGmailAccount || settings.activeGmailAccount,
            gmailAppPassword: cookieSettings.gmailAppPassword || settings.gmailAppPassword
          };
          settings = store.updateSettings(merged);
        }
      } catch (e) {}
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = getStore();

    // Recover existing credentials from cookie to avoid accidental blanking
    const cookieHeader = request.cookies.get('lb_crm_settings')?.value;
    let cookieSettings: any = {};
    if (cookieHeader) {
      try {
        try {
          cookieSettings = JSON.parse(decodeURIComponent(cookieHeader));
        } catch {
          cookieSettings = JSON.parse(cookieHeader);
        }
      } catch (e) {}
    }

    const mergedPayload = { ...body };
    if (!mergedPayload.secondaryGmailAppPassword && cookieSettings.secondaryGmailAppPassword) {
      mergedPayload.secondaryGmailAppPassword = cookieSettings.secondaryGmailAppPassword;
    }
    if (!mergedPayload.secondaryGmailUser && cookieSettings.secondaryGmailUser) {
      mergedPayload.secondaryGmailUser = cookieSettings.secondaryGmailUser;
    }
    if (!mergedPayload.gmailAppPassword && cookieSettings.gmailAppPassword) {
      mergedPayload.gmailAppPassword = cookieSettings.gmailAppPassword;
    }

    const updated = store.updateSettings(mergedPayload);
    const response = NextResponse.json({ success: true, settings: updated });

    // Write 1-year cookie to response
    try {
      const cookieData = {
        ...cookieSettings,
        ...updated,
        secondaryGmailUser: updated.secondaryGmailUser || cookieSettings.secondaryGmailUser,
        secondaryGmailAppPassword: updated.secondaryGmailAppPassword || cookieSettings.secondaryGmailAppPassword,
        gmailAppPassword: updated.gmailAppPassword || cookieSettings.gmailAppPassword
      };
      response.cookies.set('lb_crm_settings', encodeURIComponent(JSON.stringify(cookieData)), {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
        httpOnly: false
      });
    } catch (e) {}

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
