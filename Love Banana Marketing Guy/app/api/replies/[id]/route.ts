import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    const rep = store.markReplyRead(id);
    return NextResponse.json({ success: true, reply: rep });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
