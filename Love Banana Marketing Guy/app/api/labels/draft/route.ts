import { NextResponse } from 'next/server';
import { createBatchDraftsInGmail } from '@/lib/gmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, targets } = body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ error: 'targets array required' }, { status: 400 });
    }

    if (action === 'draft') {
      const draftPayload = targets.map((t: any) => ({
        id: t.id,
        to: t.email,
        subject: t.subject,
        body: t.body
      }));

      // Label distro is strictly anchored to primary band account (Channel 1: lovebananaband@gmail.com)
      const batchRes = await createBatchDraftsInGmail(draftPayload, 'primary');

      return NextResponse.json({
        success: true,
        mode: 'draft',
        simulated: batchRes.simulated,
        results: batchRes.results
      });
    } else if (action === 'send_single') {
      return NextResponse.json({
        error: 'Safety Lock Active: Direct live sending is disabled. Please use the draft option.'
      }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
