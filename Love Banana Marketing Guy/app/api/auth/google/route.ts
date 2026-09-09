import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/gmail';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/callback`;
    const authUrl = getGoogleAuthUrl(redirectUri);

    if (!authUrl) {
      return NextResponse.json(
        { error: 'Google Client ID & Secret not configured in Settings yet' },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: authUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
