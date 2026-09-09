import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    error: 'Safety Lock Active: Direct live sending from the web interface is disabled for account security. All emails must be pushed to Gmail Drafts to review and send from your phone or native Gmail app.'
  }, { status: 403 });
}
