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
  locationFrom: string;
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
  subjectVariant: string;
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

  let locationFrom = 'Sydney, Australia';
  if (locationCategory === 'sydney' || locationCategory === 'australia') {
    locationFrom = 'Sydney';
  } else {
    locationFrom = 'Sydney, Australia';
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

  // 5. Deterministic Seed Hashing & 5-Variant Story Hooks per Tier
  const hash = Array.from(contact.id || contact.email || '').reduce((acc, c) => acc + c.charCodeAt(0), seedIndex);

  // Real, authentic story hooks in Henry's voice (recorded on Gold Coast, mastered by Mikey Young, 13 tracks garage punk / playful pop)
  const TIER1_HOOKS = [
    "\"Seagull\" is the lead single from our upcoming debut LP 'Any Direction', releasing on Ragnar Records (run by Michael Barker from Gee Tee / RMFC). The album is thirteen tracks recorded on the Gold Coast and mastered by Mikey Young - pushing into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" hit #3 on the Australian AIR indie charts and we've recently supported Ty Segall, Babe Rainbow, and Bananagun.",
    "We've just released \"Seagull\", the lead track off our debut LP 'Any Direction' coming out on Ragnar Records. The album is thirteen tracks recorded on the Gold Coast and mastered by Mikey Young - pushing into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" reached #3 on the Australian AIR indie charts.",
    "Our new single \"Seagull\" is out now via Ragnar Records, taken from our debut album 'Any Direction'. Recorded on the Gold Coast and mastered by Mikey Young, the album features thirteen tracks that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Following our debut 7\" which hit #3 on the AIR indie charts, we're really excited to share this one.",
    "We're gearing up to release our debut album 'Any Direction' on Ragnar Records, mastered by Mikey Young. \"Seagull\" is the lead single - thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our previous 7\" landed at #3 on the Australian AIR indie charts.",
    "We've just dropped \"Seagull\" from our upcoming debut LP 'Any Direction' (coming out on Ragnar Records, mastered by Mikey Young). Recorded on the Gold Coast, it's thirteen tracks that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" went to #3 on the AIR charts."
  ];

  const TIER2_HOOKS = [
    "\"Seagull\" is the lead single from our upcoming debut LP 'Any Direction' (releasing on Ragnar Records, mastered by Mikey Young). The album is thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" reached #3 on the Australian AIR indie charts.",
    "Our new single \"Seagull\" is out now - the lead track from our debut album 'Any Direction' on Ragnar Records, mastered by Mikey Young. Thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our previous 7\" hit #3 on the AIR indie charts.",
    "We've just put out the lead single \"Seagull\" from our debut LP 'Any Direction' (coming out on Ragnar Records, mastered by Mikey Young). Recorded on the Gold Coast, it's thirteen tracks that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" reached #3 on the Australian AIR indie charts.",
    "We're putting out our debut album 'Any Direction' on Ragnar Records, mastered by Mikey Young. \"Seagull\" is the lead single - thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our previous release went to #3 on the AIR indie charts.",
    "We've just released our single \"Seagull\" off our upcoming debut album 'Any Direction' (Ragnar Records, mastered by Mikey Young). It features thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" hit #3 on the AIR charts."
  ];

  const TIER3_HOOKS = [
    "\"Seagull\" is the lead single from our upcoming debut album 'Any Direction' (releasing on Ragnar Records, mastered by Mikey Young). Recorded on the Gold Coast, the album features thirteen tracks that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" reached #3 on the Australian AIR indie charts.",
    "We've just released \"Seagull\", the lead track off our debut album 'Any Direction' on Ragnar Records, mastered by Mikey Young. It's thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" went to #3 on the Australian AIR charts.",
    "Our new single \"Seagull\" just dropped - the first track from our debut LP 'Any Direction' (Ragnar Records, mastered by Mikey Young). The album is thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our previous 7\" hit #3 on the Australian AIR indie charts.",
    "We're releasing our debut LP 'Any Direction' on Ragnar Records, mastered by Mikey Young. \"Seagull\" is the lead single - thirteen tracks recorded on the Gold Coast that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" went to #3 on the AIR charts.",
    "We've just put out our single \"Seagull\" from our debut album 'Any Direction' (coming out on Ragnar Records, mastered by Mikey Young). Recorded on the Gold Coast, the album features thirteen tracks that push into scrappier, more garage punk territory while keeping the playful, poppy spirit of our earlier releases. Our debut 7\" reached #3 on the AIR indie charts."
  ];

  let storyHook = '';
  const hookIndex = Math.abs(hash + 2) % 5;
  if (affinityTier === 'tier1_bullseye') {
    storyHook = TIER1_HOOKS[hookIndex];
  } else if (affinityTier === 'tier2_indie') {
    storyHook = TIER2_HOOKS[hookIndex];
  } else {
    storyHook = TIER3_HOOKS[hookIndex];
  }

  // 6. Strict Context-Aware Ask Phrase Logic Tree (No ident mentions, direct interview/feature asks)
  let askPhrase = '';
  let angleDescription = '';

  const isGrassrootsCommunity = rawNotes.includes('grassroots') || 
                                rawNotes.includes('volunteer') || 
                                cleanOutlet.toLowerCase().includes('community') ||
                                (rawCategory.includes('radio') && (rawNotes.includes('rural') || rawNotes.includes('regional')));

  const mode = (contact as any).contactMode;

  if (mode === 'label_distro') {
    askPhrase = "We'd love to know if you think the record could be a good fit for your roster. Give the stream a listen when you get a chance and let us know - no stress either way.";
    angleDescription = 'Label Distro - Physical Release Partner';
  } else if (mode === 'blog_feature' || outletType === 'Blog') {
    askPhrase = "Would you be interested in featuring the track or doing a quick Q&A / interview around the single? Happy to send through a full advance stream, hi-res press photos, or anything else you need.";
    angleDescription = 'Blog / Webzine - Track Feature or Interview';
  } else if (mode === 'magazine_review' || outletType === 'Magazine' || outletType === 'Writer/Critic') {
    askPhrase = "Would you be interested in a feature, review, or a short Q&A / interview around the album? Happy to send through the full advance album stream, hi-res press shots, or a physical copy if any of that is helpful.";
    angleDescription = 'Magazine / Press - Album Review, Feature or Interview';
  } else if (mode === 'playlist_curator' || outletType === 'Curator') {
    askPhrase = "Thought it might be a good fit for one of your playlists if you get a chance to check it out. Let us know what you think!";
    angleDescription = 'Playlist Curator';
  } else if (outletType === 'Radio') {
    if (locationCategory === 'sydney') {
      askPhrase = "Would love for you to give it a spin if you feel it fits any of your shows, and would you be interested in having us in for an in-studio chat or interview?";
      angleDescription = 'Radio Airplay + Local In-Studio Interview';
    } else if (affinityTier === 'tier3_eclectic' || isGrassrootsCommunity) {
      askPhrase = "We're big fans of what community radio does for independent music - would love for you to give this one a spin if you feel it's a good fit for your shows. Also, would you be interested in a quick phone interview or chat around the release?";
      angleDescription = 'Grassroots Community Radio Airplay + Interview';
    } else {
      askPhrase = "Would love for you to give it a spin if you feel it fits into any of your programming. Would you be interested in an interview or chat around the release?";
      angleDescription = 'Radio Airplay Consideration + Interview';
    }
  } else {
    askPhrase = "Would you be interested in an interview or feature around the single? Give the track a listen and let us know what you think - happy to send through anything else you need.";
    angleDescription = 'Music Consideration & Feature/Interview Ask';
  }

  // 7. Expanded 8x8 Natural Human Micro-Variations & Subject Line Pool
  const INTROS = [
    "Hope you're having a good week!",
    "Hope you're having a solid week!",
    "Hope things are good your end!",
    "Hope things are going well your end!",
    "Hope you're well!",
    "Hope you're having a good one!",
    "Hope you're doing well.",
    "Hope the week's treating you well!"
  ];

  const SIGNOFFS = [
    "No stress either way, really appreciate you having a listen.",
    "No stress either way, really appreciate your time.",
    "Cheers for taking the time to have a listen.",
    "Really appreciate you taking the time to check it out.",
    "Thanks heaps for your time.",
    "Let me know if you need anything else from our end!",
    "If you need anything else from us, just shout.",
    "Happy to send through anything else you need."
  ];

  const SUBJECTS = [
    `Love Banana - "Seagull" (for ${shortBrand || 'you'})`,
    'New music from Sydney: Love Banana - "Seagull"',
    'Love Banana - debut single "Seagull" (Mastered by Mikey Young)',
    'Love Banana - "Seagull" (debut LP on Ragnar Records)',
    `For ${shortBrand || 'you'}: Love Banana - "Seagull"`,
    `Australian garage pop for ${shortBrand || 'you'}: Love Banana - "Seagull"`
  ];

  const greetingIntro = INTROS[Math.abs(hash) % INTROS.length];
  const signoffLine = SIGNOFFS[Math.abs(hash + 3) % SIGNOFFS.length];
  const subjectVariant = SUBJECTS[Math.abs(hash) % SUBJECTS.length];

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
    locationFrom,
    locationBadge,
    affinityTier,
    tierBadge,
    storyHook,
    askPhrase,
    angleDescription,
    greetingIntro,
    signoffLine,
    subjectVariant
  };
}

export function shuffleLinks(links: string[], hash: number): string[] {
  if (!links || links.length <= 1) return links;
  const offset = Math.abs(hash) % links.length;
  return [...links.slice(offset), ...links.slice(0, offset)];
}

export function rotateLinkLinesInBody(bodyText: string, hash: number): string {
  const lines = bodyText.split('\n');
  const resultLines: string[] = [];
  let linkChunk: string[] = [];

  const isLinkLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const hasUrlOrTag = (
      trimmed.includes('{{wav_url}}') ||
      trimmed.includes('{{epk_url}}') ||
      trimmed.includes('{{album_url}}') ||
      trimmed.includes('{{artwork_url}}') ||
      trimmed.includes('{{spotify_url}}') ||
      trimmed.includes('{{bandcamp_url}}') ||
      trimmed.includes('http://') ||
      trimmed.includes('https://')
    );
    const hasBulletOrEmoji = (
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('🎧') ||
      trimmed.startsWith('🎨') ||
      trimmed.startsWith('📖') ||
      trimmed.startsWith('🎵') ||
      trimmed.startsWith('💿') ||
      trimmed.startsWith('📻')
    );
    return hasUrlOrTag && hasBulletOrEmoji;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isLinkLine(line)) {
      linkChunk.push(line);
    } else {
      if (linkChunk.length > 1) {
        resultLines.push(...shuffleLinks(linkChunk, hash));
        linkChunk = [];
      } else if (linkChunk.length === 1) {
        resultLines.push(linkChunk[0]);
        linkChunk = [];
      }
      resultLines.push(line);
    }
  }

  if (linkChunk.length > 1) {
    resultLines.push(...shuffleLinks(linkChunk, hash));
  } else if (linkChunk.length === 1) {
    resultLines.push(linkChunk[0]);
  }

  return resultLines.join('\n');
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
    contactMode?: string;
  };
  settings?: any;
  seedIndex?: number;
}) {
  const profile = getContactProfile(contact, seedIndex);
  const hash = Array.from(contact.id || contact.email || '').reduce((acc, c) => acc + c.charCodeAt(0), seedIndex);

  let subject = templateSubject || profile.subjectVariant || 'Love Banana - "Seagull"';
  let body = templateBody || '';

  // Subject variant resolution
  if (subject.includes('{{subject_variant}}')) {
    subject = subject.replace(/\{\{subject_variant\}\}/g, profile.subjectVariant);
  } else if (!templateSubject || templateSubject === 'Love Banana — "Seagull"' || templateSubject === 'Love Banana - "Seagull"') {
    subject = profile.subjectVariant;
  }

  // Smart protection against "spin on air" for non-radio contexts:
  if (
    profile.outletType === 'Blog' || 
    profile.outletType === 'Magazine' || 
    profile.outletType === 'Writer/Critic' || 
    (contact as any).contactMode === 'label_distro' ||
    (contact as any).contactMode === 'blog_feature' ||
    (contact as any).contactMode === 'magazine_review'
  ) {
    body = body.replace(
      /We'd love for you to give this new one a spin[^\n\r]+(\n\r?|\r)?/gi,
      `${profile.askPhrase}\n\n`
    );
    body = body.replace(
      /give this new one a spin[^\n\r]+(\n\r?|\r)?/gi,
      `${profile.askPhrase}\n\n`
    );
  }

  // Location phrase adjustment in body:
  body = body.replace(/based (here in Sydney|in Sydney, Australia|in Sydney)/gi, profile.locationPhrase);

  // Variable replacements
  const s = settings || {};
  const isSecondary = s.activeGmailAccount === 'secondary';
  const activeUserEmail = isSecondary
    ? (s.secondaryGmailUser || s.secondaryFromEmail || 'lovebananacomms@gmail.com')
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
    '{{location_from}}': profile.locationFrom,
    '{{location_intro}}': `Reaching out from ${profile.locationFrom}`,
    '{{story_hook}}': profile.storyHook,
    '{{ask_phrase}}': profile.askPhrase,
    '{{greeting_intro}}': profile.greetingIntro,
    '{{signoff_line}}': profile.signoffLine,
    '{{subject_variant}}': profile.subjectVariant,
    '{{genre_fit}}': contact.genre_fit || 'garage pop / rock and roll',
    '{{band_name}}': s.bandName || 'Love Banana',
    '{{contact_name}}': activeSenderName,
    '{{from_email}}': activeUserEmail,
    '{{single_title}}': s.singleTitle || 'Seagull',
    '{{single_release_date}}': s.singleReleaseDate || 'September 16',
    '{{album_title}}': s.albumTitle || 'Any Direction',
    '{{label}}': s.label || 'Ragnar Records',
    '{{mastered_by}}': s.masteredBy || 'Mikey Young',
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

  // Rotate asset link lines to break duplicate body hashing
  body = rotateLinkLinesInBody(body, hash);

  // Format opening greeting cleanly
  if (body.startsWith('Hey ') || body.startsWith('Hi ')) {
    body = body.replace(/^(Hey|Hi)\s+[^,\n]+,/i, profile.greeting);
  }

  // Clean any stray em dashes
  subject = subject.replace(/—/g, '-');
  body = body.replace(/—/g, '-');

  return { subject, body, profile };
}
