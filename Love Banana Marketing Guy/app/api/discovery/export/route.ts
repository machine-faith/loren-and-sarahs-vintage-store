import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const store = getStore();
    const leads = store.getLeads();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    if (format === 'json') {
      return new NextResponse(JSON.stringify(leads, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="love_banana_global_leads.json"'
        }
      });
    }

    // CSV format
    const escapeCsv = (str: string = '') => {
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = [
      'Outlet',
      'Category',
      'Country',
      'State',
      'City',
      'Contact Person',
      'Role',
      'Pitch Email',
      'Submission Type',
      'Web Form URL',
      'Host Platform',
      'Vibe Score',
      'Vibe Tags',
      'Guidelines',
      'Status',
      'Website',
      'Source Platform',
      'Notes'
    ];

    const rows = leads.map(l => [
      escapeCsv(l.outlet),
      escapeCsv(l.category),
      escapeCsv(l.country),
      escapeCsv(l.state || ''),
      escapeCsv(l.city),
      escapeCsv(l.contactPerson || l.name),
      escapeCsv(l.role || ''),
      escapeCsv(l.pitchEmail || ''),
      escapeCsv(l.submissionType),
      escapeCsv(l.webFormUrl || ''),
      escapeCsv(l.hostPlatform),
      escapeCsv(String(l.vibeScore)),
      escapeCsv((l.vibeTags || []).join('; ')),
      escapeCsv(l.guidelines || ''),
      escapeCsv(l.status),
      escapeCsv(l.websiteUrl),
      escapeCsv(l.sourcePlatform),
      escapeCsv(l.notes || '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="love_banana_global_leads.csv"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
