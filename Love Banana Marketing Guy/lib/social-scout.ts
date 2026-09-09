import { DiscoveredLead } from './db';
import { evaluateVibe } from './vibe-filter';

export interface SocialCrawlResult {
  leads: Array<Omit<DiscoveredLead, 'id' | 'discoveredAt'>>;
  scannedCount: number;
  newMatchesCount: number;
}

const REDDIT_COMMUNITIES = [
  { sub: 'GarageRock', category: 'Community', tag: 'Garage Rock Subreddit' },
  { sub: 'indiemusicfeedback', category: 'Curator', tag: 'Feedback & Curator Calls' },
  { sub: 'cassetteculture', category: 'Label', tag: 'Cassette DIY Tape Culture' },
  { sub: 'CollegeRadio', category: 'Radio', tag: 'College Radio Presenters' },
  { sub: 'indieheads', category: 'Blog', tag: 'Indieheads Community' }
];

export async function scourReddit(): Promise<SocialCrawlResult> {
  const discovered: Array<Omit<DiscoveredLead, 'id' | 'discoveredAt'>> = [];
  let scannedCount = 0;

  for (const community of REDDIT_COMMUNITIES) {
    try {
      const url = `https://www.reddit.com/r/${community.sub}/new.json?limit=20`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) BandSpot-Scout/1.0'
        }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const posts = data?.data?.children || [];
      scannedCount += posts.length;

      for (const item of posts) {
        const post = item.data;
        if (!post) continue;

        const title = post.title || '';
        const selftext = post.selftext || '';
        const author = post.author || '';
        const postUrl = `https://www.reddit.com${post.permalink}`;
        const combinedText = `${title} ${selftext}`;

        // Look for music submission, radio show, playlist, or review callouts
        const isSubmissionSignal = 
          combinedText.toLowerCase().includes('submit') ||
          combinedText.toLowerCase().includes('send me your') ||
          combinedText.toLowerCase().includes('playlist') ||
          combinedText.toLowerCase().includes('radio show') ||
          combinedText.toLowerCase().includes('reviewing') ||
          combinedText.toLowerCase().includes('tape label') ||
          combinedText.toLowerCase().includes('new single');

        if (isSubmissionSignal) {
          // Extract email if present
          const emailMatch = combinedText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
          const formMatch = combinedText.match(/https?:\/\/(?:docs\.google\.com\/forms\/[^\s"'>]+|forms\.gle\/[^\s"'>]+)/i);

          const vibe = evaluateVibe(combinedText, community.category, `r/${community.sub}`);

          if (vibe.vibeScore >= 60) {
            discovered.push({
              name: `u/${author} (${community.sub})`,
              outlet: `r/${community.sub} — ${title.slice(0, 50)}`,
              category: community.category as any,
              country: 'International',
              city: 'Online Community',
              websiteUrl: postUrl,
              hostPlatform: 'Reddit',
              submissionType: emailMatch ? 'direct_email' : (formMatch ? 'web_form' : 'social_community'),
              pitchEmail: emailMatch ? emailMatch[1].toLowerCase() : undefined,
              contactPerson: author ? `u/${author}` : undefined,
              webFormUrl: formMatch ? formMatch[0] : postUrl,
              guidelines: `Reddit callout: "${title.slice(0, 80)}..."`,
              vibeScore: vibe.vibeScore,
              vibeTags: Array.from(new Set([...vibe.vibeTags, community.tag, 'Reddit Community'])),
              sourcePlatform: 'reddit',
              status: 'discovered',
              notes: `Discovered in r/${community.sub}. Post: ${title}`
            });
          }
        }
      }
    } catch {
      // Ignore individual Reddit rate limits or timeouts
    }
  }

  return {
    leads: discovered,
    scannedCount,
    newMatchesCount: discovered.length
  };
}

/**
 * Returns curated high-value indie culture spaces (DIY tape labels, indie discords, tastemaker YouTube channels)
 */
export function getCuratedCultureSpaces(): Array<Omit<DiscoveredLead, 'id' | 'discoveredAt'>> {
  return [
    {
      name: "David Dean Burkhart",
      outlet: "David Dean Burkhart (YouTube & Spotify)",
      category: "Curator",
      country: "USA",
      city: "Los Angeles",
      websiteUrl: "https://www.youtube.com/user/daviddeanburkhart",
      hostPlatform: "YouTube / Spotify",
      submissionType: "direct_email",
      pitchEmail: "daviddeanburkhart@gmail.com",
      contactPerson: "David Dean Burkhart",
      role: "Curator / Founder",
      guidelines: "Streaming links (SoundCloud/Spotify/Dropbox). No attachments. High focus on bedroom pop, garage pop, and jangle.",
      vibeScore: 98,
      vibeTags: ["🍌 High Love Banana Fit", "Garage Pop", "Tastemaker YouTube", "Jangle Pop"],
      sourcePlatform: "web",
      status: "discovered",
      notes: "Premier global tastemaker for garage pop, lo-fi, and indie rock."
    },
    {
      name: "Austin Town Hall",
      outlet: "Austin Town Hall (ATH Records & Blog)",
      category: "Blog",
      country: "USA",
      city: "Austin, TX",
      websiteUrl: "https://austintownhall.com",
      hostPlatform: "WordPress",
      submissionType: "direct_email",
      pitchEmail: "austintownhall@gmail.com",
      contactPerson: "Nathan Lankford",
      role: "Senior Editor",
      guidelines: "Direct stream link, release date, and high-res art. Huge fan of Australian garage & jangle pop.",
      vibeScore: 97,
      vibeTags: ["🍌 High Love Banana Fit", "Garage Pop", "Austin Scene", "Jangle Pop"],
      sourcePlatform: "web",
      status: "discovered",
      notes: "Legendary indie/garage blog and tape label. Consistently champions Australian underground bands."
    },
    {
      name: "Post-Trash",
      outlet: "Post-Trash",
      category: "Blog",
      country: "USA",
      city: "Brooklyn, NY",
      websiteUrl: "http://post-trash.com",
      hostPlatform: "Squarespace",
      submissionType: "direct_email",
      pitchEmail: "posttrashmusic@gmail.com",
      contactPerson: "Dan Goldin",
      role: "Editor-in-Chief",
      guidelines: "Private Soundcloud or Bandcamp stream. Loves scuzzy DIY guitar rock and post-punk.",
      vibeScore: 96,
      vibeTags: ["🍌 High Love Banana Fit", "DIY Community", "Post-Punk", "Scuzzy Rock"],
      sourcePlatform: "web",
      status: "discovered",
      notes: "Influential underground DIY webzine. Dedicated to tape culture and fuzzy guitar riffs."
    },
    {
      name: "Raven Sings The Blues",
      outlet: "Raven Sings The Blues",
      category: "Blog",
      country: "USA",
      city: "Rhode Island",
      websiteUrl: "https://ravensingstheblues.com",
      hostPlatform: "WordPress",
      submissionType: "direct_email",
      pitchEmail: "ravensingstheblues@gmail.com",
      contactPerson: "Tyler Wilcox",
      role: "Editor",
      guidelines: "Streaming links. High affinity for psych, garage, and Antipodean jangle/punk.",
      vibeScore: 95,
      vibeTags: ["🍌 High Love Banana Fit", "Garage Rock", "Psych Rock", "Aus Scene Supporter"],
      sourcePlatform: "web",
      status: "discovered",
      notes: "Essential reading for psych, garage, and underground record collectors."
    },
    {
      name: "Goner Records Submissions",
      outlet: "Goner Records & Festival",
      category: "Label",
      country: "USA",
      city: "Memphis, TN",
      websiteUrl: "https://goner-records.com",
      hostPlatform: "Shopify",
      submissionType: "direct_email",
      pitchEmail: "gonerrecords@gmail.com",
      contactPerson: "Zac & Eric",
      role: "Founders / A&R",
      guidelines: "Cassettes/Vinyl or digital stream. The global holy grail for garage punk and scuzzy rock.",
      vibeScore: 99,
      vibeTags: ["🍌 High Love Banana Fit", "Garage Punk", "Cassette/Vinyl", "DIY Community"],
      sourcePlatform: "discogs",
      status: "discovered",
      notes: "Home of Gonerfest. Premier garage-punk institution worldwide."
    },
    {
      name: "Indieheads Discord Music Hub",
      outlet: "r/indieheads Community Server",
      category: "Community",
      country: "International",
      city: "Discord",
      websiteUrl: "https://discord.gg/indieheads",
      hostPlatform: "Discord",
      submissionType: "social_community",
      webFormUrl: "https://discord.gg/indieheads",
      guidelines: "Share in #fresh-music and weekly showcase channels. Active music writers and radio DJs hang out here.",
      vibeScore: 88,
      vibeTags: ["Indie Rock", "Community", "Discord Music Hub"],
      sourcePlatform: "discord",
      status: "discovered",
      notes: "30k+ member indie music community with dedicated emerging artist promotion threads."
    }
  ];
}
