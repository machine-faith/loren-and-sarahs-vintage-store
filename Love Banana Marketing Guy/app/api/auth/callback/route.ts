import { NextResponse } from 'next/server';
import { handleAuthCallback } from '@/lib/gmail';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const redirectUri = `${url.origin}/api/auth/callback`;

    if (!code) {
      return NextResponse.redirect(`${url.origin}/?auth_error=no_code`);
    }

    await handleAuthCallback(code, redirectUri);
    return NextResponse.redirect(`${url.origin}/?connected=true`);
  } catch (error: any) {
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error.message)}`);
  }
}
