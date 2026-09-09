import Papa from 'papaparse';
import { Contact } from './db';

export interface ParsedContactPreview {
  name: string;
  email: string;
  outlet: string;
  category: Contact['category'];
  country: string;
  city: string;
  genre_fit: string;
  notes: string;
}

export function parseContactsCsv(csvText: string): { contacts: ParsedContactPreview[]; totalRows: number; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy'
  });

  const contacts: ParsedContactPreview[] = [];
  const errors: string[] = [];

  if (result.errors && result.errors.length > 0) {
    result.errors.forEach(e => errors.push(`Row ${e.row}: ${e.message}`));
  }

  const rows = result.data || [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const keys = Object.keys(row);

    const findKey = (candidates: string[]) => {
      return keys.find(k => candidates.some(c => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(c)));
    };

    // Find email
    const emailKey = findKey(['email', 'mail']);
    const email = (emailKey ? row[emailKey] : '').trim();

    if (!email || !email.includes('@')) {
      continue; // Skip invalid emails
    }

    // Find name
    const fullNameKey = findKey(['fullname', 'contactname', 'name']);
    const firstNameKey = findKey(['firstname', 'first']);
    const lastNameKey = findKey(['lastname', 'last']);

    let name = '';
    if (fullNameKey && row[fullNameKey]?.trim()) {
      name = row[fullNameKey].trim();
    } else if (firstNameKey || lastNameKey) {
      const first = (firstNameKey ? row[firstNameKey] : '')?.trim() || '';
      const last = (lastNameKey ? row[lastNameKey] : '')?.trim() || '';
      name = `${first} ${last}`.trim();
    }
    if (!name) {
      name = email.split('@')[0];
    }

    // Find outlet / company
    const outletKey = findKey(['company', 'associatedcompany', 'outlet', 'station', 'publication', 'blog', 'venue', 'magazine', 'organization']);
    const outlet = (outletKey ? row[outletKey] : '')?.trim() || '';

    // Category detection
    const categoryKey = findKey(['category', 'type', 'outlettype', 'industry']);
    let category: Contact['category'] = 'Radio';

    const rawCategory = (categoryKey ? row[categoryKey] : '')?.toLowerCase() || '';
    const combinedSearch = `${rawCategory} ${outlet} ${name}`.toLowerCase();

    if (combinedSearch.includes('radio') || combinedSearch.includes('fm') || combinedSearch.includes('broadcast') || combinedSearch.includes('station')) {
      category = 'Radio';
    } else if (combinedSearch.includes('blog') || combinedSearch.includes('webzine') || combinedSearch.includes('site')) {
      category = 'Blog';
    } else if (combinedSearch.includes('magazine') || combinedSearch.includes('zine') || combinedSearch.includes('press') || combinedSearch.includes('print')) {
      category = 'Magazine';
    } else if (combinedSearch.includes('curator') || combinedSearch.includes('playlist') || combinedSearch.includes('spotify')) {
      category = 'Curator';
    } else if (combinedSearch.includes('venue') || combinedSearch.includes('club') || combinedSearch.includes('promoter') || combinedSearch.includes('booking')) {
      category = 'Venue';
    } else {
      category = 'Radio';
    }

    // Country
    const countryKey = findKey(['country', 'countryregion', 'nation', 'state']);
    const country = (countryKey ? row[countryKey] : '')?.trim() || '';

    // City
    const cityKey = findKey(['city', 'town', 'location']);
    const city = (cityKey ? row[cityKey] : '')?.trim() || '';

    // Genre / Sound fit
    const genreKey = findKey(['genre', 'sound', 'music', 'format']);
    const genre_fit = (genreKey ? row[genreKey] : '')?.trim() || 'Garage Pop, Indie, Alt-Rock';

    // Notes
    const notesKey = findKey(['notes', 'description', 'comments', 'leadstatus']);
    const notes = (notesKey ? row[notesKey] : '')?.trim() || '';

    contacts.push({
      name,
      email,
      outlet,
      category,
      country,
      city,
      genre_fit,
      notes
    });
  }

  return { contacts, totalRows: rows.length, errors };
}
