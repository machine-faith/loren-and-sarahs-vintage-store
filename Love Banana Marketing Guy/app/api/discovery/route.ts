import { NextResponse } from 'next/server';
import { getStore, DiscoveredLead } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const store = getStore();
    let leads = store.getLeads();

    // Auto-seed if empty
    if (leads.length === 0) {
      const seedsPath = path.join(process.cwd(), 'data', 'global_indie_seeds.json');
      if (fs.existsSync(seedsPath)) {
        const raw = fs.readFileSync(seedsPath, 'utf-8');
        const seeds = JSON.parse(raw);
        leads = store.addLeadsBulk(seeds);
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const submissionType = searchParams.get('submissionType');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    let filtered = [...leads];

    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (submissionType) {
      filtered = filtered.filter(l => l.submissionType === submissionType);
    }
    if (category) {
      filtered = filtered.filter(l => l.category === category);
    }
    if (search) {
      filtered = filtered.filter(l => 
        l.outlet.toLowerCase().includes(search) ||
        l.name.toLowerCase().includes(search) ||
        (l.pitchEmail && l.pitchEmail.toLowerCase().includes(search)) ||
        l.country.toLowerCase().includes(search) ||
        (l.city && l.city.toLowerCase().includes(search)) ||
        l.vibeTags.some(t => t.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      total: leads.length,
      filteredCount: filtered.length,
      leads: filtered
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const store = getStore();
    const body = await request.json();

    if (Array.isArray(body)) {
      const added = store.addLeadsBulk(body);
      return NextResponse.json({ success: true, count: added.length, leads: added });
    } else {
      const newLead = store.addLead(body);
      return NextResponse.json({ success: true, lead: newLead });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
