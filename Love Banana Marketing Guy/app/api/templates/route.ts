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

    let { channel, name, target_category, subject, body: templateBody, id } = body;

    if (!subject || !templateBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    if (channel === 'radio') {
      target_category = 'Radio';
      name = name || 'Master Radio Station Pitch';
      id = id || 'tpl-syd';
    } else if (channel === 'blog') {
      target_category = 'Blog';
      name = name || 'Master Blog & Press Feature';
      id = id || 'tpl-press';
    } else if (channel === 'label') {
      target_category = 'Label';
      name = name || 'Master Record Label Distro Pitch';
      id = id || 'tpl-label-distro';
    }

    if (!name) {
      name = 'Master Custom Pitch';
    }

    const saved = store.saveTemplate({
      id,
      name,
      target_category: target_category || 'Radio',
      subject,
      body: templateBody
    });

    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
