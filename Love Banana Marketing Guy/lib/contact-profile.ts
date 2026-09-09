import { AffinityTier, DecisionRecord } from './db';

export interface ContactProfile {
  name: string;
  cleanName: string;
  isTeamOrDept: boolean;
  greeting: string;
  outletType: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Writer/Critic' | 'Other';
  outletBadge: {
    label: string;
    icon: string;
    bg: string;
    border: string;
    text: string;
  };
  outletName: string;
  locationCategory: 'sydney' | 'australia' | 'international';
  locationPhrase: string;
  locationBadge: {
    label: string;
    bg: string;
  };
  affinityTier: AffinityTier;
  tierBadge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  storyHook: string;
  askPhrase: string;
  angleDescription: string;
  greetingIntro: string;
  signoffLine: string;
}

const TEAM_KEYWORDS = [
  'team', 'dept', 'department', 'music', 'programming', 'programmers', 'redaktion', 
  'radio', 'fm', 'staff', 'office', 'reception', 'desk', 'submissions', 'crew', 'station',
  'presenters', 'announcers', 'directors', 'director', 'editorial', 'editors', 'editor'
];

export function getContactProfile(
  contact: {
    id?: string;
    name?: string;
    email?: string;
    outlet?: string;
    notes?: string;
    category?: string;
    city?: string;
    country?: string;
    genre_fit?: string;
  },
  seedIndex: number = 0
): ContactProfile {
  const rawName = (contact.name || '').trim();
  const rawOutlet = (contact.outlet || '').trim();
  const rawNotes = (contact.notes || '').toLowerCase();
  const rawCategory = (contact.category || '').toLowerCase();
  const city = (contact.city || '').toLowerCase();
  const country = (contact.country || '').toLowerCase();

  // 1. Clean outlet name
  let cleanOutlet = rawOutlet;
  if (!cleanOutlet && rawName) {
    cleanOutlet = rawName;
  }
  const shortBrand = cleanOutlet
    .replace(/\s*(94\.5FM|107\.3FM|102\.7FM|106\.7FM|102\.1FM|92\.1FM|99\.3\s*FM|103\.7FM|94\.9|97\.1FM|101\.5FM|99\.9\s*FM|FM|AM)\b/gi, '')
    .trim() || cleanOutlet;

  // 2. Identify if contact name is an individual person or a station/team
  const nameLower = rawName.toLowerCase();
  const isTeam = TEAM_KEYWORDS.some(k => nameLower.includes(k)) || 
                 nameLower.includes('(') || 
                 rawName.split(' ').length > 3;

  let firstName = '';
  let greeting = '';

  if (!rawName) {
    greeting = 'Hey,';
  } else if (isTeam) {
    if (shortBrand && shortBrand.length <= 15) {
      greeting = `Hey ${shortBrand} team,`;
    } else {
      greeting = 'Hey team,';
    }
  } else {
    // Individual person
    firstName = rawName.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    greeting = firstName ? `Hey ${firstName},` : 'Hey,';
  }

  // 3. Identify Outlet Type
  let outletType: ContactProfile['outletType'] = 'Radio';
  if (rawCategory.includes('blog') || nameLower.includes('blog') || rawNotes.includes('blog') || cleanOutlet.toLowerCase().includes('blog')) {
    outletType = 'Blog';
  } else if (rawCategory.includes('magazine') || rawNotes.includes('magazine') || cleanOutlet.toLowerCase().includes('magazine') || cleanOutlet.toLowerCase().includes('press')) {
    outletType = 'Magazine';
  } else if (rawCategory.includes('curator') || rawNotes.includes('playlist') || cleanOutlet.toLowerCase().includes('playlist')) {
    outletType = 'Curator';
  } else if (rawNotes.includes('critic') || rawNotes.includes('writer') || rawNotes.includes('journalist')) {
    outletType = 'Writer/Critic';
  } else if (rawCategory.includes('radio') || cleanOutlet.toLowerCase().includes('radio') || cleanOutlet.toLowerCase().includes('fm')) {
    outletType = 'Radio';
  } else {
    outletType = 'Radio';
  }

  const outletBadge = {
    Radio: { label: 'Radio Station', icon: '📻', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
    Blog: { label: 'Music Blog', icon: '📝', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    Magazine: { label: 'Music Magazine / Press', icon: '📰', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    Curator: { label: 'Playlist Curator', icon: '🎧', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    'Writer/Critic': { label: 'Music Journalist / Critic', icon: '✍️', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    Other: { label: 'Music Media', icon: '🎵', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  }[outletType];

  // 4. Identify Location Category & Location Phrase
  let locationCategory: 'sydney' | 'australia' | 'international' = 'international';
  let locationPhrase = 'based in Sydney, Australia';
  let locationBadge = { label: '🌏 International', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };

  if (
    city.includes('sydney') ||
    rawNotes.includes('sydney') ||
    cleanOutlet.toLowerCase().includes('fbi') ||
    cleanOutlet.toLowerCase().includes('2ser') ||
    cleanOutlet.toLowerCase().includes('skid row') ||
    cleanOutlet.toLowerCase().includes('eastside') ||
    cleanOutlet.toLowerCase().includes('northern beaches') ||
    cleanOutlet.toLowerCase().includes('northside') ||
    cleanOutlet.toLowerCase().includes('swr') ||
    cleanOutlet.toLowerCase().includes('surg')
  ) {
    locationCategory = 'sydney';
    locationPhrase = 'based here in Sydney';
    locationBadge = { label: '📍 Local Sydney', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  } else if (
    country.includes('australia') ||
    city.includes('melbourne') ||
    city.includes('brisbane') ||
    city.includes('perth') ||
    city.includes('adelaide') ||
    city.includes('hobart') ||
    city.includes('darwin') ||
    city.includes('canberra') ||
    cleanOutlet.toLowerCase().includes('rrr') ||
    cleanOutlet.toLowerCase().includes('pbs') ||
    cleanOutlet.toLowerCase().includes('4zzz') ||
    cleanOutlet.toLowerCase().includes('rtr')
  ) {
    locationCategory = 'australia';
    locationPhrase = 'based in Sydney';
  } else if (
    country.includes('new zealand') ||
    country.includes('nz') ||
    cleanOutlet.toLowerCase().includes('bfm') ||
    cleanOutlet.toLowerCase().includes('radioactive') ||
    cleanOutlet.toLowerCase().includes('rdu') ||
    city.includes('auckland') ||
    city.includes('wellington') ||
    city.includes('christchurch') ||
    city.includes('dunedin')
  ) {
    locationCategory = 'international';
    locationPhrase = 'based across the ditch in Sydney';
    locationBadge = { label: '🇳🇿 New Zealand', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }

  // 5. Tiered Affinity (Wide Net & Serendipity Principle)
  let affinityTier: AffinityTier = (contact as any).affinityTier || 'tier3_eclectic';
  const genreLower = (contact.genre_fit || '').toLowerCase();
  
  if (!(contact as any).affinityTier) {
    if (
      genreLower.includes('garage') || 
      genreLower.includes('jangle') || 
      rawNotes.includes('bulls-eye') ||
      rawNotes.includes('straight arrows') ||
      rawNotes.includes('mikey young') ||
      locationCategory === 'sydney'
    ) {
      affinityTier = 'tier1_bullseye';
    } else if (
      genreLower.includes('indie') || 
      genreLower.includes('alternative') || 
      genreLower.includes('rock') || 
      genreLower.includes('college') ||
      rawNotes.includes('broad indie')
    ) {
      affinityTier = 'tier2_indie';
    } else {
      affinityTier = 'tier3_eclectic';
    }
  }

  const tierBadge = {
    tier1_bullseye: { label: '🎯 BULLS-EYE FIT', bg: 'bg-[#ff761a]/15', text: 'text-[#ff761a]', border: 'border-[#ff761a]/30' },
    tier2_indie: { label: '🎸 INDIE / ALT CHAMPION', bg: 'bg-[#50a8ff]/15', text: 'text-[#50a8ff]', border: 'border-[#50a8ff]/30' },
    tier3_eclectic: { label: '📻 ECLECTIC / REGIONAL', bg: 'bg-[#00f044]/15', text: 'text-[#00f044]', border: 'border-[#00f044]/30' },
  }[affinityTier];

  // Tailored story hook based on affinity tier (Wide Net approach)
  let storyHook = '';
  if (affinityTier === 'tier1_bullseye') {
    storyHook = "It's a fast, upbeat track about local beach birds taking your hot chips, recorded in Petersham and mastered by Owen Penglis (Straight Arrows).";
  } else if (affinityTier === 'tier2_indie') {
    storyHook = "It's a fast, upbeat garage pop track with catchy group-vocal hooks and scuzzy guitars off our upcoming debut LP 'Any Direction'.";
  } else {
    storyHook = 'It\'s a fun, upbeat rock and roll track about local beach birds taking your hot chips, following our recent 7" which hit #3 on the Australian Independent Record Labels (AIR) charts.';
  }

  // 6. Context-aware ask phrase
  let askPhrase = '';
  let angleDescription = '';

  const isGrassrootsCommunity = rawNotes.includes('grassroots') || 
                                rawNotes.includes('volunteer') || 
                                cleanOutlet.toLowerCase().includes('community') ||
                                (rawCategory.includes('radio') && (rawNotes.includes('rural') || rawNotes.includes('regional')));

  if (outletType === 'Radio') {
    if (locationCategory === 'sydney') {
      askPhrase = "We'd love for you to give this new one a spin if you feel it fits any of your programming, and we'd also love to be considered for any in-studio chats or interviews!";
      angleDescription = 'Radio Airplay + Local In-Studio Chats';
    } else if (isGrassrootsCommunity || affinityTier === 'tier3_eclectic') {
      askPhrase = "We're huge supporters of grassroots community radio, and we'd be stoked if you gave this new one a spin if you feel it fits any of your shows!";
      angleDescription = 'Grassroots Community Radio Airplay';
    } else {
      askPhrase = "We'd love for you to give this new one a spin if you feel it fits any of your programming and we'd also love to be considered for any interviews!";
      angleDescription = 'Radio Airplay + Remote/Phone Interview';
    }
  } else if (outletType === 'Blog') {
    askPhrase = "We'd love for you to give it a listen and see if you might be interested in featuring or reviewing the track, or premiering the video/album stream down the line.";
    angleDescription = 'Blog Feature / Video Premiere (Radio spin wording removed)';
  } else if (outletType === 'Magazine' || outletType === 'Writer/Critic') {
    askPhrase = "Thought you might like to give it a listen for any upcoming reviews, album roundups, or features you're working on.";
    angleDescription = 'Editorial Review / Album Roundup';
  } else if (outletType === 'Curator') {
    askPhrase = "Thought it might be a good fit for any of your indie or garage playlists if you get a chance to check it out.";
    angleDescription = 'Playlist Placement Consideration';
  } else {
    askPhrase = "We'd love for you to give this new one a spin if you feel it fits your shows, and we'd also love to be considered for any interviews!";
    angleDescription = 'Airplay & Music Consideration';
  }

  // 7. Natural Human Micro-Variations (breaches spam filter duplicate-body hashing)
  const hash = Array.from(contact.id || contact.email || '').reduce((acc, c) => acc + c.charCodeAt(0), seedIndex);

  const intros = [
    "Hope you're well!",
    "Hope you're having a good week!",
    "Hope you're doing well!"
  ];
  const signoffs = [
    "Let us know if you need anything else from us!",
    "Let me know if you need anything else from our end!",
    "If you need anything else from us, just shout!"
  ];

  const greetingIntro = intros[hash % intros.length];
  const signoffLine = signoffs[(hash + 1) % signoffs.length];

  return {
    name: rawName,
    cleanName: firstName || shortBrand || 'there',
    isTeamOrDept: isTeam,
    greeting,
    outletType,
    outletBadge,
    outletName: shortBrand,
    locationCategory,
    locationPhrase,
    locationBadge,
    affinityTier,
    tierBadge,
    storyHook,
    askPhrase,
    angleDescription,
    greetingIntro,
    signoffLine
  };
}

export function renderPitchClient({
  templateSubject,
  templateBody,
  contact,
  settings,
  seedIndex = 0
}: {
  templateSubject: string;
  templateBody: string;
  contact: {
    id?: string;
    name?: string;
    email?: string;
    outlet?: string;
    notes?: string;
    category?: string;
    city?: string;
    country?: string;
    genre_fit?: string;
  };
  settings?: any;
  seedIndex?: number;
}) {
  const profile = getContactProfile(contact, seedIndex);

  let subject = templateSubject || 'Love Banana — "Seagull"';
  let body = templateBody || '';

  // Smart protection against "spin on air" for Blogs & Magazines:
  if (profile.outletType === 'Blog' || profile.outletType === 'Magazine' || profile.outletType === 'Writer/Critic') {
    body = body.replace(
      /We'd love for you to give this new one a spin[^\n\r]+(\n\r?|\r)?/gi,
      `${profile.askPhrase}\n\n`
    );
  }

  // Location phrase adjustment in body:
  body = body.replace(/based (here in Sydney|in Sydney, Australia|in Sydney)/gi, profile.locationPhrase);

  // Variable replacements
  const s = settings || {};
  const isSecondary = s.activeGmailAccount === 'secondary';
  const activeUserEmail = isSecondary
    ? (s.secondaryGmailUser || s.secondaryFromEmail || 'lovebananapress@gmail.com')
    : (s.fromEmail || s.gmailUser || 'lovebananaband@gmail.com');
  const activeSenderName = isSecondary
    ? (s.secondaryContactName || s.contactName || 'Henry Collins')
    : (s.contactName || 'Henry Collins');

  const replacements: Record<string, string> = {
    '{{first_name}}': profile.cleanName,
    '{{greeting}}': profile.greeting,
    '{{name}}': contact.name || '',
    '{{outlet}}': profile.outletName || 'your outlet',
    '{{category}}': contact.category || profile.outletType,
    '{{country}}': contact.country || 'Australia',
    '{{city}}': contact.city || '',
    '{{location_phrase}}': profile.locationPhrase,
    '{{location_intro}}': `Reaching out from ${profile.locationCategory === 'sydney' ? 'here in Sydney' : 'Sydney'}`,
    '{{story_hook}}': profile.storyHook,
    '{{ask_phrase}}': profile.askPhrase,
    '{{greeting_intro}}': profile.greetingIntro,
    '{{signoff_line}}': profile.signoffLine,
    '{{genre_fit}}': contact.genre_fit || 'garage pop / rock and roll',
    '{{band_name}}': s.bandName || 'Love Banana',
    '{{contact_name}}': activeSenderName,
    '{{from_email}}': activeUserEmail,
    '{{single_title}}': s.singleTitle || 'Seagull',
    '{{single_release_date}}': s.singleReleaseDate || 'September 16',
    '{{album_title}}': s.albumTitle || 'Any Direction',
    '{{label}}': s.label || 'Ragnar Records',
    '{{mastered_by}}': s.masteredBy || 'Owen Penglis (Straight Arrows)',
    '{{epk_url}}': s.epkUrl || 'https://love-banana-epk.vercel.app/epk.html',
    '{{album_url}}': s.albumUrl || 'https://love-banana-epk.vercel.app/album.html',
    '{{wav_url}}': s.wavDownloadUrl || 'https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav',
    '{{artwork_url}}': s.artworkDownloadUrl || 'https://love-banana-epk.vercel.app/downloads/Seagull%20-%20Artwork.png',
    '{{spotify_url}}': s.spotifyUrl || 'https://open.spotify.com/artist/lovebanana',
    '{{bandcamp_url}}': s.bandcampUrl || 'https://lovebanana.bandcamp.com/',
    '{{instagram_url}}': s.instagramUrl || 'https://instagram.com/lovebananaband',
  };

  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    subject = subject.replace(regex, val);
    body = body.replace(regex, val);
  }

  // Format opening greeting cleanly
  if (body.startsWith('Hey ') || body.startsWith('Hi ')) {
    body = body.replace(/^(Hey|Hi)\s+[^,\n]+,/i, profile.greeting);
  }

  return { subject, body, profile };
}
