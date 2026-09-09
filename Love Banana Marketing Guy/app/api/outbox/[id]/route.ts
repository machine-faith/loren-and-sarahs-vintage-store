import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    const item = store.getOutboxItem(id);
    if (!item) {
      return NextResponse.json({ error: 'Outbox item not found' }, { status: 404 });
    }
    const contact = store.getContactById(item.contact_id);
    return NextResponse.json({ item: { ...item, contact } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = getStore();

    const updated = store.updateOutboxItem(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Outbox item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    store.deleteOutboxItem(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
