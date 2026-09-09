import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json({ templates: store.getTemplates() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    const saved = store.saveTemplate(body);
    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
