import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { generateOutboxDrafts } from '@/lib/pitch-engine';

export async function GET(request: Request) {
  try {
    const store = getStore();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let outbox = store.getOutbox();
    if (status && status !== 'all') {
      outbox = outbox.filter(o => o.status === status);
    }

    // Join with contact information
    const items = outbox.map(item => {
      const contact = store.getContactById(item.contact_id);
      return {
        ...item,
        contact
      };
    });

    return NextResponse.json({ outbox: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactIds, templateId, subject, body: customBody } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      );
    }

    const created = generateOutboxDrafts(contactIds, templateId, subject, customBody);
    return NextResponse.json({ success: true, count: created.length, created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const store = getStore();
    store.clearOutbox(status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
