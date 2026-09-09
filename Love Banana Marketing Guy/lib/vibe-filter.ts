/**
 * Love Banana Vibe & Anti-Cringe Filter
 * Evaluates whether an outlet, website, or community thread matches
 * Love Banana's garage-pop / DIY aesthetic and flags corporate/cringe media.
 */

import { AffinityTier } from './db';

export interface VibeEvaluation {
  vibeScore: number; // 0 - 100
  vibeTags: string[];
  affinityTier: AffinityTier;
  tierLabel: string;
  isRecommended: boolean;
  isCringeCommercial: boolean;
  notes: string;
  matchedAnchors: string[];
}

const POSITIVE_KEYWORDS = [
  // Primary subgenres & sonic anchors
  { term: 'garage pop', weight: 25, tag: 'Garage Pop' },
  { term: 'garage rock', weight: 22, tag: 'Garage Rock' },
  { term: 'jangle pop', weight: 22, tag: 'Jangle Pop' },
  { term: 'guitar pop', weight: 18, tag: 'Guitar Pop' },
  { term: 'power pop', weight: 18, tag: 'Power Pop' },
  { term: 'surf rock', weight: 16, tag: 'Surf Rock' },
  { term: 'post-punk', weight: 16, tag: 'Post-Punk' },
  { term: 'lo-fi', weight: 16, tag: 'Lo-Fi' },
  { term: 'indie rock', weight: 14, tag: 'Indie Rock' },
  { term: 'indie pop', weight: 16, tag: 'Indie Pop' },
  { term: 'psych rock', weight: 16, tag: 'Psych Rock' },
  { term: 'psych', weight: 14, tag: 'Psych' },
  { term: 'fuzz', weight: 14, tag: 'Fuzz / Scuzzy' },
  { term: 'punk', weight: 14, tag: 'Punk' },
  { term: 'bedroom pop', weight: 10, tag: 'Bedroom Pop' },
  { term: 'alternative', weight: 10, tag: 'Alternative' },
  
  // Sound-alikes & scene legends
  { term: 'straight arrows', weight: 25, tag: 'Straight Arrows Anchor' },
  { term: 'mikey young', weight: 25, tag: 'Mikey Young Mastered' },
  { term: 'owen penglis', weight: 25, tag: 'Owen Penglis Anchor' },
  { term: 'ty segall', weight: 22, tag: 'Ty Segall Anchor' },
  { term: 'the clean', weight: 22, tag: 'The Clean (Flying Nun)' },
  { term: 'babe rainbow', weight: 20, tag: 'Babe Rainbow Anchor' },
  { term: 'dick diver', weight: 20, tag: 'Dick Diver Anchor' },
  { term: 'eddy current', weight: 22, tag: 'Eddy Current Anchor' },
  { term: 'king gizzard', weight: 18, tag: 'King Gizzard Anchor' },
  { term: 'the chats', weight: 18, tag: 'The Chats Anchor' },
  { term: 'flightless', weight: 16, tag: 'Flightless Records' },
  
  // Broad cultural & independent broadcast tokens
  { term: 'diy', weight: 18, tag: 'DIY Community' },
  { term: 'community radio', weight: 18, tag: 'Community Radio' },
  { term: 'college radio', weight: 20, tag: 'College Radio' },
  { term: 'student radio', weight: 18, tag: 'Student Radio' },
  { term: 'amrap', weight: 20, tag: 'AMRAP Supporter' },
  { term: 'cbaa', weight: 16, tag: 'CBAA Member' },
  { term: 'australian music', weight: 16, tag: 'Aus Scene Supporter' },
  { term: 'aussie', weight: 12, tag: 'Aus Scene' },
  { term: 'tape', weight: 12, tag: 'Cassette/Vinyl' },
  { term: 'cassette', weight: 14, tag: 'Cassette Culture' },
  { term: 'vinyl', weight: 10, tag: 'Vinyl' },
  { term: 'independent', weight: 10, tag: 'Independent' },
  { term: 'underground', weight: 12, tag: 'Underground' },
  { term: 'beach', weight: 10, tag: 'Coastal / Beach' }
];

const CRINGE_COMMERCIAL_KEYWORDS = [
  'guaranteed feature $',
  'pay to play',
  'submission fee $',
  'pay $',
  'sponsored post $',
  'crypto',
  'web3',
  'top 40 commercial',
  'iheartmedia',
  'clear channel',
  'nova entertainment',
  'hit network',
  'commercial hit radio',
  'mainstream edm'
];

export function evaluateVibe(
  text: string, 
  category: string = 'Radio', 
  outletName: string = ''
): VibeEvaluation {
  const normalized = `${outletName} ${category} ${text}`.toLowerCase();
  
  // Check for cringe or commercial paywalls
  let isCringeCommercial = false;
  for (const cringe of CRINGE_COMMERCIAL_KEYWORDS) {
    if (normalized.includes(cringe)) {
      isCringeCommercial = true;
      break;
    }
  }

  const matchedTags = new Set<string>();
  const matchedAnchors: string[] = [];
  let score = 40; // Base score for independent music outlets

  // Boost by category
  if (category === 'Radio') score += 15;
  if (category === 'Blog' || category === 'Magazine') score += 10;
  if (category === 'Community') score += 15;

  for (const { term, weight, tag } of POSITIVE_KEYWORDS) {
    if (normalized.includes(term)) {
      score += weight;
      matchedTags.add(tag);
      matchedAnchors.push(term);
    }
  }

  // Cap score between 0 and 100
  score = Math.min(Math.max(score, 10), 99);

  if (isCringeCommercial) {
    score = Math.min(score, 25);
    matchedTags.add('⚠️ Corporate / Pay-to-Play');
  } else if (score >= 75) {
    matchedTags.add('🎯 Bulls-Eye Match');
  }

  // Tiered Affinity Engine (Wide Net & Serendipity Principle)
  let affinityTier: AffinityTier = 'tier3_eclectic';
  let tierLabel = '📻 Tier 3: Eclectic / Regional Champion';

  if (isCringeCommercial) {
    tierLabel = '⚠️ Disqualified (Corporate / Pay-to-Play)';
  } else if (score >= 75) {
    affinityTier = 'tier1_bullseye';
    tierLabel = '🎯 Tier 1: Core Bulls-Eye (Garage / Jangle / Sydney Scene)';
  } else if (score >= 55) {
    affinityTier = 'tier2_indie';
    tierLabel = '🎸 Tier 2: Broad Indie & Alternative Champion';
  } else {
    affinityTier = 'tier3_eclectic';
    tierLabel = '📻 Tier 3: Eclectic Broadcaster & Regional Discovery';
  }

  const vibeTags = Array.from(matchedTags).slice(0, 4);
  // Wide Net Rule: Every non-commercial outlet is recommended for outreach!
  const isRecommended = !isCringeCommercial && score >= 35;

  let notes = '';
  if (isCringeCommercial) {
    notes = 'Quarantined: Commercial paywall or corporate network. Do not pitch.';
  } else if (affinityTier === 'tier1_bullseye') {
    notes = 'Bulls-Eye: Direct match for garage pop, jangle hooks, or local Sydney indie scene.';
  } else if (affinityTier === 'tier2_indie') {
    notes = 'Broad Indie: Active supporter of guitar music, alternative rock, and emerging bands.';
  } else {
    notes = 'Eclectic / Regional Champion: Welcomes good energetic songs. Pitch the coastal narrative and catchy hooks.';
  }

  return {
    vibeScore: score,
    vibeTags,
    affinityTier,
    tierLabel,
    isRecommended,
    isCringeCommercial,
    notes,
    matchedAnchors: matchedAnchors.slice(0, 5)
  };
}
