import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const store = getStore();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const stage = searchParams.get('stage');
    const country = searchParams.get('country');

    let contacts = store.getContacts();

    if (search) {
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.outlet.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'all') {
      contacts = contacts.filter(c => c.category === category);
    }

    if (stage && stage !== 'all') {
      contacts = contacts.filter(c => c.stage === stage);
    }

    if (country && country !== 'all') {
      contacts = contacts.filter(c => c.country.toLowerCase() === country.toLowerCase());
    }

    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const newContact = store.addContact({
      name: body.name,
      email: body.email,
      outlet: body.outlet || '',
      category: body.category || 'Radio',
      country: body.country || '',
      city: body.city || '',
      genre_fit: body.genre_fit || '',
      notes: body.notes || '',
      stage: body.stage || 'lead',
      last_contacted_at: null
    });

    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
