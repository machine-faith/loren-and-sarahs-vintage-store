import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { parseContactsCsv } from '@/lib/csv-importer';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let parsedContacts: any[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.csvText) {
        const res = parseContactsCsv(body.csvText);
        parsedContacts = res.contacts;
      } else if (Array.isArray(body.contacts)) {
        parsedContacts = body.contacts;
      }
    } else {
      const csvText = await request.text();
      const res = parseContactsCsv(csvText);
      parsedContacts = res.contacts;
    }

    if (!parsedContacts || parsedContacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts could be extracted from input' }, { status: 400 });
    }

    const store = getStore();
    const imported = store.addContactsBulk(
      parsedContacts.map(c => ({
        name: c.name || 'Unknown',
        email: c.email,
        outlet: c.outlet || '',
        category: c.category || 'Radio',
        country: c.country || '',
        city: c.city || '',
        genre_fit: c.genre_fit || '',
        notes: c.notes || '',
        stage: 'lead',
        last_contacted_at: null
      }))
    );

    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      contacts: imported
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
