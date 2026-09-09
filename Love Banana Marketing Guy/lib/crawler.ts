import { evaluateVibe, VibeEvaluation } from './vibe-filter';
import { DiscoveredLead, DecisionRecord, AffinityTier } from './db';

export interface CrawlResult {
  url: string;
  hostPlatform: string;
  musicEmails: string[];
  primaryEmail?: string;
  contactPerson?: string;
  role?: string;
  webFormUrl?: string;
  submissionType: 'direct_email' | 'web_form' | 'social_community';
  guidelines?: string;
  vibeScore: number;
  vibeTags: string[];
  affinityTier: AffinityTier;
  tierLabel: string;
  decisionRecord?: DecisionRecord;
  scrapedShow?: {
    showTitle: string;
    presenterName?: string;
    airtime?: string;
    genreTags?: string[];
  };
  writerByline?: {
    authorName: string;
    articleTitle?: string;
    authorEmail?: string;
  };
  daysSinceActive?: number;
  notes?: string;
  error?: string;
}

const COMMON_SUBMISSION_PATHS = [
  '',
  '/music-submissions',
  '/submit-music',
  '/submit',
  '/music',
  '/program-guide',
  '/programs',
  '/shows',
  '/schedule',
  '/contact-us',
  '/contact',
  '/about-us',
  '/staff',
  '/editorial-team'
];

// Negative blacklist: emails that must never receive artist pitches
const DISCARD_PATTERNS = [
  { pattern: /sales@/i, reason: 'Commercial / Advertising sales inbox' },
  { pattern: /sponsorship@/i, reason: 'Station sponsorship / corporate partnerships' },
  { pattern: /advertising@/i, reason: 'Commercial advertising sales desk' },
  { pattern: /sponsor@/i, reason: 'Commercial sponsorship department' },
  { pattern: /accounts@/i, reason: 'Accounts payable / billing department' },
  { pattern: /billing@/i, reason: 'Billing & financial operations' },
  { pattern: /finance@/i, reason: 'Accounting & finance department' },
  { pattern: /invoices@/i, reason: 'Invoicing department' },
  { pattern: /volunteer@/i, reason: 'Volunteer coordination & onboarding' },
  { pattern: /volunteering@/i, reason: 'Volunteer recruitment desk' },
  { pattern: /internships@/i, reason: 'Student internship inquiries' },
  { pattern: /jobs@/i, reason: 'Job recruitment & HR' },
  { pattern: /careers@/i, reason: 'Careers desk' },
  { pattern: /tickets@/i, reason: 'Ticket sales & box office' },
  { pattern: /boxoffice@/i, reason: 'Box office venue ticketing' },
  { pattern: /legal@/i, reason: 'Legal & compliance counsel' },
  { pattern: /privacy@/i, reason: 'Privacy policy compliance' },
  { pattern: /copyright@/i, reason: 'DMCA / Copyright agent' },
  { pattern: /webmaster@/i, reason: 'IT / Website technical administrator' },
  { pattern: /support@/i, reason: 'Technical support helpdesk' },
  { pattern: /it@/i, reason: 'Internal IT infrastructure' },
  { pattern: /admin@/i, reason: 'General administrative operations (fallback only)' }
];

export function detectHostPlatform(html: string, headers: Headers): string {
  const lowerHtml = html.toLowerCase();
  
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) return 'WordPress';
  if (lowerHtml.includes('squarespace.com') || lowerHtml.includes('static1.squarespace.com')) return 'Squarespace';
  if (lowerHtml.includes('wix.com') || lowerHtml.includes('wixsite.com') || lowerHtml.includes('_wix_')) return 'Wix';
  if (lowerHtml.includes('ghost.org') || lowerHtml.includes('ghost-portal')) return 'Ghost CMS';
  if (lowerHtml.includes('webflow.com') || lowerHtml.includes('data-wf-site')) return 'Webflow';
  if (lowerHtml.includes('shopify.com')) return 'Shopify';
  if (lowerHtml.includes('weebly.com')) return 'Weebly';
  
  const server = headers.get('server')?.toLowerCase() || '';
  if (server.includes('cloudflare')) return 'Cloudflare Custom';
  if (server.includes('nginx')) return 'Nginx Custom';
  if (server.includes('apache')) return 'Apache Custom';

  return 'Custom Web Engine';
}

export function extractEmails(html: string): string[] {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const matches = html.match(emailRegex) || [];
  
  const ignoredExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.js', '.css', '.woff', '.woff2'];
  const uniqueEmails = new Set<string>();

  for (const match of matches) {
    const clean = match.trim().toLowerCase();
    const isImage = ignoredExtensions.some(ext => clean.endsWith(ext));
    if (!isImage && clean.includes('.') && clean.length > 5 && !clean.includes('example.com') && !clean.includes('sentry.io')) {
      uniqueEmails.add(clean);
    }
  }

  return Array.from(uniqueEmails);
}

/**
 * Evaluates candidate emails with role classification, negative filtering,
 * and produces a full DecisionRecord explaining why the primary contact was selected.
 */
export function evaluateCandidateEmails(
  candidateEmails: string[],
  category: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Other',
  sourceUrl: string,
  sonicMatches: string[],
  scrapedShowName?: string
): {
  selectedEmail?: string;
  selectedRole?: string;
  confidenceScore: number;
  decisionRecord: DecisionRecord;
  usableEmails: string[];
} {
  const discardedEmails: Array<{ email: string; reason: string }> = [];
  const qualifiedCandidates: Array<{
    email: string;
    role: string;
    weight: number;
    rationale: string;
  }> = [];

  for (const email of candidateEmails) {
    // Check against negative discard patterns
    const discardMatch = DISCARD_PATTERNS.find(d => d.pattern.test(email));
    if (discardMatch) {
      discardedEmails.push({ email, reason: discardMatch.reason });
      continue;
    }

    // Role classification based on media category
    if (category === 'Radio') {
      if (scrapedShowName && (email.includes(scrapedShowName.toLowerCase().replace(/\s+/g, '')) || email.startsWith('show@') || email.startsWith('presenter@'))) {
        qualifiedCandidates.push({
          email,
          role: 'Specialty Show Presenter',
          weight: 100,
          rationale: `Direct show contact matching specialty program "${scrapedShowName}". Highest curation autonomy.`
        });
      } else if (email.startsWith('music@') || email.startsWith('submissions@') || email.startsWith('musicdirector@') || email.startsWith('md@')) {
        qualifiedCandidates.push({
          email,
          role: 'Music Director / Central Intake',
          weight: 95,
          rationale: 'Verified central station music department. Primary ingestion point for playlist and rotation review.'
        });
      } else if (email.startsWith('programming@') || email.startsWith('airplay@') || email.startsWith('promos@') || email.startsWith('onair@')) {
        qualifiedCandidates.push({
          email,
          role: 'Programming / Airplay Desk',
          weight: 80,
          rationale: 'Station programming and on-air coordination desk.'
        });
      } else if (email.startsWith('interviews@') || email.startsWith('editorial@')) {
        qualifiedCandidates.push({
          email,
          role: 'Interviews & In-Studio Coordinator',
          weight: 65,
          rationale: 'Handles artist interviews and live in-studio features.'
        });
      } else if (email.startsWith('info@') || email.startsWith('contact@') || email.startsWith('hello@')) {
        qualifiedCandidates.push({
          email,
          role: 'General Station Ingestion (Fallback)',
          weight: 40,
          rationale: 'General inquiries inbox. Staff routinely forward new music to programming committee.'
        });
      } else {
        qualifiedCandidates.push({
          email,
          role: 'Named Staff Member / Presenter',
          weight: 55,
          rationale: 'Direct personal station inbox.'
        });
      }
    } else {
      // Blog / Magazine / Webzine
      if (email.startsWith('reviews@') || email.startsWith('submissions@') || email.startsWith('music@')) {
        qualifiedCandidates.push({
          email,
          role: 'Reviews / Music Submissions Desk',
          weight: 100,
          rationale: 'Dedicated editorial intake desk for track premieres, album reviews, and features.'
        });
      } else if (email.startsWith('editor@') || email.startsWith('features@') || email.startsWith('managingeditor@')) {
        qualifiedCandidates.push({
          email,
          role: 'Editorial Director / Editor',
          weight: 90,
          rationale: 'Chief editorial lead for music coverage and premiere decisions.'
        });
      } else if (email.startsWith('writers@') || email.startsWith('team@')) {
        qualifiedCandidates.push({
          email,
          role: 'Writing Staff / Contributor Pool',
          weight: 60,
          rationale: 'Shared inbox for music journalists and contributors.'
        });
      } else if (email.startsWith('info@') || email.startsWith('contact@') || email.startsWith('hello@')) {
        qualifiedCandidates.push({
          email,
          role: 'General Publication Contact',
          weight: 35,
          rationale: 'General contact desk. Will forward editorial pitches to music section.'
        });
      } else {
        qualifiedCandidates.push({
          email,
          role: 'Staff Writer / Critic',
          weight: 70,
          rationale: 'Direct journalist contact.'
        });
      }
    }
  }

  // Sort qualified candidates by weight descending
  qualifiedCandidates.sort((a, b) => b.weight - a.weight);

  const topPick = qualifiedCandidates[0];
  const selectedEmail = topPick?.email;
  const selectedRole = topPick?.role || 'General Contact';
  const confidenceScore = topPick?.weight || (candidateEmails.length > 0 ? 30 : 0);
  const selectionRationale = topPick?.rationale || 'Fallback contact identified on outlet web properties.';

  const decisionRecord: DecisionRecord = {
    evaluatedAt: new Date().toISOString(),
    sourceUrl,
    detectedCategory: category,
    candidateEmailsFound: candidateEmails,
    discardedEmails,
    selectedEmail: selectedEmail || '',
    selectionRole: selectedRole,
    confidenceScore,
    selectionRationale,
    sonicMatchesFound: sonicMatches,
    affinityTier: confidenceScore >= 80 ? 'tier1_bullseye' : (confidenceScore >= 55 ? 'tier2_indie' : 'tier3_eclectic')
  };

  return {
    selectedEmail,
    selectedRole,
    confidenceScore,
    decisionRecord,
    usableEmails: qualifiedCandidates.map(c => c.email)
  };
}

export function detectWebSubmissionForm(html: string): { url?: string; type?: string } | null {
  const lowerHtml = html.toLowerCase();
  
  // Google Forms
  const gFormMatch = html.match(/https?:\/\/(?:docs\.google\.com\/forms\/[^\s"'>]+|forms\.gle\/[^\s"'>]+)/i);
  if (gFormMatch) return { url: gFormMatch[0], type: 'Google Form' };

  // Typeform
  const typeformMatch = html.match(/https?:\/\/[a-zA-Z0-9.-]+\.typeform\.com\/to\/[a-zA-Z0-9]+/i);
  if (typeformMatch) return { url: typeformMatch[0], type: 'Typeform' };

  // Dropbox File Request
  const dropboxMatch = html.match(/https?:\/\/www\.dropbox\.com\/request\/[a-zA-Z0-9]+/i);
  if (dropboxMatch) return { url: dropboxMatch[0], type: 'Dropbox Audio Request' };

  // JotForm
  const jotformMatch = html.match(/https?:\/\/(?:form\.)?jotform\.com\/[0-9]+/i);
  if (jotformMatch) return { url: jotformMatch[0], type: 'JotForm' };

  // Amrap AirIt
  if (lowerHtml.includes('amrap.org.au')) return { url: 'https://amrap.org.au', type: 'Amrap AirIt Portal' };

  return null;
}

export function extractContactName(html: string): { name?: string; role?: string } {
  const patterns = [
    /(?:Music\s+Director|Music\s+Coordinator|Music\s+Programmer|Head\s+of\s+Music)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
    /(?:Editor-in-Chief|Editor|Reviews\s+Editor|Music\s+Editor)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
    /(?:Station\s+Manager|Program\s+Director)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
    /(?:Presented\s+by|Host(?:ed)?\s+by)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i
  ];

  for (const pat of patterns) {
    const match = html.match(pat);
    if (match && match[1]) {
      const titleMatch = match[0].split(/[:\s-]+/)[0];
      return {
        name: match[1].trim(),
        role: titleMatch
      };
    }
  }

  return {};
}

export function extractShowInformation(html: string): {
  showTitle?: string;
  presenterName?: string;
  airtime?: string;
  genreTags?: string[];
} {
  const showMatch = html.match(/(?:show|program|broadcast)[:\s-]+["“]?([A-Za-z0-9\s&'-]{3,35})["”]?/i);
  const hostMatch = html.match(/(?:hosted\s+by|presented\s+by|with\s+host)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i);
  const timeMatch = html.match(/(?:Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)\s+(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);

  const foundGenres: string[] = [];
  const genreTokens = ['garage', 'punk', 'jangle', 'indie', 'alternative', 'guitar pop', 'local', 'rock'];
  const lower = html.toLowerCase();
  for (const token of genreTokens) {
    if (lower.includes(token)) foundGenres.push(token);
  }

  if (showMatch && showMatch[1]) {
    return {
      showTitle: showMatch[1].trim(),
      presenterName: hostMatch ? hostMatch[1].trim() : undefined,
      airtime: timeMatch ? timeMatch[0].trim() : undefined,
      genreTags: foundGenres
    };
  }

  return {};
}

export function extractWriterByline(html: string): {
  authorName?: string;
  articleTitle?: string;
} {
  const bylineMatch = html.match(/(?:by|written\s+by|words\s+by)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i);
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

  if (bylineMatch && bylineMatch[1]) {
    return {
      authorName: bylineMatch[1].trim(),
      articleTitle: titleMatch ? titleMatch[1].trim() : undefined
    };
  }

  return {};
}

export function estimateLiveness(html: string): number | undefined {
  const timeMatch = html.match(/datetime=["'](\d{4}-\d{2}-\d{2}[^"']*)["']/i);
  if (timeMatch && timeMatch[1]) {
    const pubDate = new Date(timeMatch[1]);
    if (!isNaN(pubDate.getTime())) {
      const diffDays = Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  }

  const dateRegex = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(202[0-9])/i;
  const textDateMatch = html.match(dateRegex);
  if (textDateMatch) {
    const pubDate = new Date(textDateMatch[0]);
    if (!isNaN(pubDate.getTime())) {
      const diffDays = Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  }

  return undefined;
}

export function extractGuidelines(html: string): string {
  const lowerHtml = html.toLowerCase();
  const notes: string[] = [];

  if (lowerHtml.includes('mp3') && lowerHtml.includes('320')) {
    notes.push('Prefers 320kbps MP3');
  } else if (lowerHtml.includes('wav')) {
    notes.push('Accepts high-res WAV');
  }

  if (lowerHtml.includes('no attachment') || lowerHtml.includes('do not attach audio') || lowerHtml.includes('links only')) {
    notes.push('Links only (no audio attachments)');
  }

  if (lowerHtml.includes('soundcloud') || lowerHtml.includes('streaming link')) {
    notes.push('Streaming link preferred');
  }

  if (lowerHtml.includes('include bio') || lowerHtml.includes('press release') || lowerHtml.includes('press kit')) {
    notes.push('Include EPK & Bio');
  }

  return notes.length > 0 ? notes.join(' • ') : 'Standard digital pitch format';
}

/**
 * Deep crawl a target station / outlet domain with context-aware evaluation
 */
export async function crawlDomain(
  targetUrl: string, 
  outletName: string = '', 
  category: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Community' | 'Label' | 'Other' = 'Radio'
): Promise<CrawlResult> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const cat = (category === 'Community' || category === 'Label') ? 'Radio' : category;

  try {
    const urlObj = new URL(cleanUrl);
    const origin = urlObj.origin;

    // 1. Fetch homepage first
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }

    const html = await res.text();
    const hostPlatform = detectHostPlatform(html, res.headers);
    let allRawEmails = extractEmails(html);
    let formInfo = detectWebSubmissionForm(html);
    let contactInfo = extractContactName(html);
    let guidelines = extractGuidelines(html);
    let showInfo = extractShowInformation(html);
    let bylineInfo = extractWriterByline(html);
    let daysSinceActive = estimateLiveness(html);

    // If no programming email or form found, crawl targeted paths
    const hasSpecialistEmail = allRawEmails.some(e => 
      e.startsWith('music') || e.startsWith('submissions') || e.startsWith('programming') || e.startsWith('reviews')
    );

    if (!hasSpecialistEmail && !formInfo) {
      for (const path of ['/submit', '/music-submissions', '/programs', '/schedule', '/contact', '/about']) {
        try {
          const subUrl = `${origin}${path}`;
          const subController = new AbortController();
          const subTimeout = setTimeout(() => subController.abort(), 4000);

          const subRes = await fetch(subUrl, {
            signal: subController.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          clearTimeout(subTimeout);

          if (subRes.ok) {
            const subHtml = await subRes.text();
            const subEmails = extractEmails(subHtml);
            if (subEmails.length > 0) {
              allRawEmails = Array.from(new Set([...allRawEmails, ...subEmails]));
            }
            if (!formInfo) formInfo = detectWebSubmissionForm(subHtml);
            if (!contactInfo.name) contactInfo = extractContactName(subHtml);
            if (!showInfo.showTitle) showInfo = extractShowInformation(subHtml);
            if (!bylineInfo.authorName) bylineInfo = extractWriterByline(subHtml);
            if (daysSinceActive === undefined) daysSinceActive = estimateLiveness(subHtml);
            if (!guidelines || guidelines === 'Standard digital pitch format') {
              const subGuide = extractGuidelines(subHtml);
              if (subGuide !== 'Standard digital pitch format') guidelines = subGuide;
            }
            if (allRawEmails.some(e => e.startsWith('music') || e.startsWith('submission') || e.startsWith('reviews'))) break;
          }
        } catch {
          // Ignore individual subpath timeouts
        }
      }
    }

    // Evaluate vibe & sonic anchors
    const vibeEval = evaluateVibe(`${html.slice(0, 5000)} ${guidelines}`, category, outletName);

    // Evaluate candidate emails and build DecisionRecord
    const evalResult = evaluateCandidateEmails(
      allRawEmails,
      cat as any,
      cleanUrl,
      vibeEval.matchedAnchors,
      showInfo.showTitle
    );

    const primaryEmail = evalResult.selectedEmail;
    const detectedRole = evalResult.selectedRole || contactInfo.role;
    const finalContactPerson = contactInfo.name || showInfo.presenterName || bylineInfo.authorName;

    const submissionType: 'direct_email' | 'web_form' = formInfo && !primaryEmail 
      ? 'web_form' 
      : 'direct_email';

    return {
      url: cleanUrl,
      hostPlatform,
      musicEmails: evalResult.usableEmails,
      primaryEmail,
      contactPerson: finalContactPerson,
      role: detectedRole,
      webFormUrl: formInfo?.url,
      submissionType,
      guidelines,
      vibeScore: vibeEval.vibeScore,
      vibeTags: vibeEval.vibeTags,
      affinityTier: vibeEval.affinityTier,
      tierLabel: vibeEval.tierLabel,
      decisionRecord: evalResult.decisionRecord,
      scrapedShow: showInfo.showTitle ? {
        showTitle: showInfo.showTitle,
        presenterName: showInfo.presenterName,
        airtime: showInfo.airtime,
        genreTags: showInfo.genreTags
      } : undefined,
      writerByline: bylineInfo.authorName ? bylineInfo as any : undefined,
      daysSinceActive,
      notes: `${vibeEval.notes} [Platform: ${hostPlatform}]`
    };
  } catch (err: any) {
    const fallbackVibe = evaluateVibe(targetUrl, category, outletName);
    return {
      url: cleanUrl,
      hostPlatform: 'Domain Unreachable / Timeout',
      musicEmails: [],
      submissionType: 'direct_email',
      vibeScore: fallbackVibe.vibeScore,
      vibeTags: fallbackVibe.vibeTags,
      affinityTier: fallbackVibe.affinityTier,
      tierLabel: fallbackVibe.tierLabel,
      notes: fallbackVibe.notes,
      error: err.message || 'Failed to crawl domain'
    };
  }
}

