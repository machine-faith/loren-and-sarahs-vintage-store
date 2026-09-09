import { NextResponse } from 'next/server';
import { getStore } from '@/lib/db';
import { crawlDomain } from '@/lib/crawler';
import { scourReddit, getCuratedCultureSpaces } from '@/lib/social-scout';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const store = getStore();
    const body = await request.json();
    const { mode, url, outletName, category } = body;

    if (mode === 'reddit') {
      // Scour live Reddit communities
      const redditResult = await scourReddit();
      let added: any[] = [];
      if (redditResult.leads.length > 0) {
        added = store.addLeadsBulk(redditResult.leads);
      }
      return NextResponse.json({
        success: true,
        mode: 'reddit',
        message: `Scanned ${redditResult.scannedCount} community posts. Found ${added.length} high-fit submission leads.`,
        scannedCount: redditResult.scannedCount,
        addedCount: added.length,
        leads: added
      });
    }

    if (mode === 'culture') {
      // Curated DIY culture spaces (tape labels, tastemaker channels, discords)
      const spaces = getCuratedCultureSpaces();
      const added = store.addLeadsBulk(spaces);
      return NextResponse.json({
        success: true,
        mode: 'culture',
        message: `Loaded ${added.length} top-tier DIY culture hubs, tape labels & curators.`,
        addedCount: added.length,
        leads: added
      });
    }

    if (mode === 'custom' && url) {
      // Crawl a specific domain
      const crawlResult = await crawlDomain(url, outletName || 'Custom Target', category || 'Radio');
      
      const newLead = store.addLead({
        name: crawlResult.contactPerson || outletName || crawlResult.url,
        outlet: outletName || new URL(crawlResult.url).hostname.replace(/^www\./, ''),
        category: category || 'Radio',
        country: 'International',
        city: 'Online',
        websiteUrl: crawlResult.url,
        hostPlatform: crawlResult.hostPlatform,
        submissionType: crawlResult.submissionType,
        pitchEmail: crawlResult.primaryEmail,
        contactPerson: crawlResult.contactPerson,
        role: crawlResult.role,
        webFormUrl: crawlResult.webFormUrl,
        guidelines: crawlResult.guidelines,
        vibeScore: crawlResult.vibeScore,
        vibeTags: crawlResult.vibeTags,
        sourcePlatform: 'web',
        status: 'discovered',
        affinityTier: crawlResult.affinityTier,
        decision_record: crawlResult.decisionRecord,
        notes: crawlResult.notes
      });

      return NextResponse.json({
        success: true,
        mode: 'custom',
        message: `Successfully crawled ${crawlResult.url}. Detected ${crawlResult.hostPlatform}. ${crawlResult.tierLabel}`,
        lead: newLead,
        crawlDetails: crawlResult
      });
    }

    if (mode === 'deep_verify_australia') {
      // Deep crawl sample of Australian community stations
      const csvPath = path.join(process.cwd(), 'data', 'australian_community_radio_music_only_master.csv');
      if (!fs.existsSync(csvPath)) {
        return NextResponse.json({ success: false, error: 'Australian master CSV not found' }, { status: 404 });
      }

      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].split(',');

      // Crawl first 8 stations or any pending verification to demonstrate live deep crawling
      const sampleStations = lines.slice(1, 9).map(line => {
        const parts = line.split(',');
        return {
          callsign: parts[0]?.trim(),
          name: parts[1]?.trim(),
          state: parts[2]?.trim(),
          city: parts[3]?.trim(),
          website: parts[6]?.trim(),
          email: parts[7]?.trim()
        };
      }).filter(s => s.website && s.website.length > 3);

      const verifiedLeads: any[] = [];

      for (const st of sampleStations) {
        try {
          const webUrl = st.website.startsWith('http') ? st.website : `http://${st.website}`;
          const crawl = await crawlDomain(webUrl, st.name, 'Radio');
          
          const lead = store.addLead({
            name: crawl.contactPerson || st.name,
            outlet: `${st.name} (${st.callsign || ''})`.trim(),
            category: 'Radio',
            country: 'Australia',
            state: st.state,
            city: st.city,
            websiteUrl: crawl.url,
            hostPlatform: crawl.hostPlatform,
            submissionType: crawl.submissionType,
            pitchEmail: crawl.primaryEmail || st.email,
            contactPerson: crawl.contactPerson,
            role: crawl.role || 'Music Director',
            webFormUrl: crawl.webFormUrl,
            guidelines: crawl.guidelines || 'Community radio airplay submission',
            vibeScore: Math.max(crawl.vibeScore, 85),
            vibeTags: Array.from(new Set([...crawl.vibeTags, 'Australian Music', `${st.state} Radio`])),
            sourcePlatform: 'directory',
            status: 'discovered',
            affinityTier: crawl.affinityTier,
            decision_record: crawl.decisionRecord,
            notes: `Deep-verified website: ${crawl.hostPlatform}. Ingested from CBAA master.`
          });
          verifiedLeads.push(lead);
        } catch {
          // Continue with next station
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'deep_verify_australia',
        message: `Deep-verified ${verifiedLeads.length} Australian stations. Audited host platforms and submission routes.`,
        addedCount: verifiedLeads.length,
        leads: verifiedLeads
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid mode specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
