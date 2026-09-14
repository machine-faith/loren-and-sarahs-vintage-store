import fs from 'fs';
import path from 'path';

export type AffinityTier = 'tier1_bullseye' | 'tier2_indie' | 'tier3_eclectic';

export interface DecisionRecord {
  evaluatedAt: string;
  sourceUrl: string;
  detectedCategory: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Other';
  candidateEmailsFound: string[];
  discardedEmails: Array<{
    email: string;
    reason: string;
  }>;
  selectedEmail: string;
  selectionRole: string;
  confidenceScore: number; // 0 - 100
  selectionRationale: string;
  sonicMatchesFound: string[];
  outletLivenessDaysSinceActive?: number;
  affinityTier: AffinityTier;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  outlet: string;
  role?: string;
  category: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Venue' | 'Other';
  country: string;
  city: string;
  genre_fit: string;
  notes: string;
  stage: 'lead' | 'drafted' | 'awaiting_approval' | 'sent' | 'replied' | 'won' | 'follow_up';
  last_contacted_at: string | null;
  created_at: string;
  affinityTier?: AffinityTier;
  decision_record?: DecisionRecord;
  contactMode?: 'radio_airplay' | 'blog_feature' | 'magazine_review' | 'playlist_curator' | 'label_distro';
}

export interface DispatchState {
  current_stage: 1 | 2 | 3 | 4;
  stage_start_date: string;       // ISO date "2026-09-09"
  daily_cap: number;
  sent_today: number;
  sent_today_date: string;        // ISO date - if different from today, reset sent_today to 0
  bounced_today: number;
  bounced_total: number;
  sent_total: number;
  last_batch_start_time: string | null;
  status: 'healthy' | 'paused' | 'frozen';
}

export interface PitchTemplate {
  id: string;
  name: string;
  target_category: string;
  subject: string;
  body: string;
  created_at: string;
}

export interface OutboxItem {
  id: string;
  contact_id: string;
  subject: string;
  body: string;
  status: 'draft' | 'approved' | 'sent' | 'failed';
  gmail_draft_id: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ReplyItem {
  id: string;
  contact_id: string | null;
  gmail_thread_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  snippet: string;
  body: string;
  received_at: string;
  is_read: boolean;
}

export interface Settings {
  bandName: string;
  contactName: string;
  fromEmail: string;
  hometown: string;
  genre: string;
  epkUrl: string;
  albumUrl: string;
  singleTitle: string;
  singleReleaseDate: string;
  albumTitle: string;
  label: string;
  masteredBy: string;
  wavDownloadUrl: string;
  artworkDownloadUrl: string;
  spotifyUrl: string;
  bandcampUrl: string;
  instagramUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  // Primary Gmail Account
  gmailUser: string;
  gmailAppPassword: string;
  primaryAccountLabel?: string;
  // Secondary / Safe Outreach Gmail Account
  secondaryGmailUser?: string;
  secondaryGmailAppPassword?: string;
  secondaryFromEmail?: string;
  secondaryContactName?: string;
  secondaryAccountLabel?: string;
  // Active Sender Selector
  activeGmailAccount?: 'primary' | 'secondary';
  replyToEmail?: string;
  simulationMode: string; // 'true' | 'false'
}

export interface DiscoveredLead {
  id: string;
  name: string;
  outlet: string;
  category: 'Radio' | 'Blog' | 'Magazine' | 'Curator' | 'Community' | 'Label' | 'Other';
  country: string;
  state?: string;
  city: string;
  websiteUrl: string;
  hostPlatform: string;
  submissionType: 'direct_email' | 'web_form' | 'social_community';
  pitchEmail?: string;
  contactPerson?: string;
  role?: string;
  webFormUrl?: string;
  guidelines?: string;
  vibeScore: number; // 0 - 100
  vibeTags: string[];
  sourcePlatform: 'web' | 'reddit' | 'discord' | 'discogs' | 'facebook' | 'directory';
  status: 'discovered' | 'approved' | 'dismissed' | 'submitted';
  discoveredAt: string;
  notes?: string;
  affinityTier?: AffinityTier;
  decision_record?: DecisionRecord;
}

interface DatabaseSchema {
  contacts: Contact[];
  templates: PitchTemplate[];
  outbox: OutboxItem[];
  replies: ReplyItem[];
  leads?: DiscoveredLead[];
  settings: Record<string, string>;
  dispatch_state?: DispatchState;
}

const IS_VERCEL = !!process.env.VERCEL;
const BASE_DATA_DIR = path.join(process.cwd(), 'data');
const SEED_FILE = path.join(BASE_DATA_DIR, 'bandspot.json');

const DB_DIR = IS_VERCEL ? '/tmp/bandspot_data' : BASE_DATA_DIR;
const DB_FILE = path.join(DB_DIR, 'bandspot.json');

function ensureDirectoryExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function getDefaultData(): DatabaseSchema {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    dispatch_state: {
      current_stage: 1,
      stage_start_date: todayStr,
      daily_cap: 25,
      sent_today: 0,
      sent_today_date: todayStr,
      bounced_today: 0,
      bounced_total: 0,
      sent_total: 0,
      last_batch_start_time: null,
      status: 'healthy'
    },
    settings: {
      bandName: "Love Banana",
      contactName: "Henry Collins",
      fromEmail: "lovebananaband@gmail.com",
      hometown: "Sydney, Australia",
      genre: "Five-piece garage pop / scuzzy rock & roll",
      epkUrl: "https://love-banana-epk.vercel.app/epk.html",
      albumUrl: "https://love-banana-epk.vercel.app/album.html",
      singleTitle: "Seagull",
      singleReleaseDate: "September 16",
      albumTitle: "Any Direction",
      label: "Ragnar Records",
      masteredBy: "Mikey Young",
      wavDownloadUrl: "https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav",
      artworkDownloadUrl: "https://love-banana-epk.vercel.app/downloads/Seagull%20-%20Artwork.png",
      spotifyUrl: "https://open.spotify.com/artist/1x9qaTZAvF4e79h2Lj6dZC",
      bandcampUrl: "https://lovebanana.bandcamp.com/",
      instagramUrl: "https://www.instagram.com/lovebanarna/?hl=en",
      googleClientId: "",
      googleClientSecret: "",
      googleRefreshToken: "",
      gmailUser: "lovebananaband@gmail.com",
      gmailAppPassword: "",
      simulationMode: "true" // safe simulation by default
    },
    templates: [
      {
        id: "tpl-1",
        name: `"Seagull" - European Indie Radio Pitch`,
        target_category: "Radio",
        subject: `{{subject_variant}}`,
        body: `Hey {{first_name}},

Hope you're well! Reaching out from Sydney, Australia. I play guitar and sing in a garage pop / rock and roll five-piece called Love Banana.

We're putting out the lead single "Seagull" from our debut album 'Any Direction' (coming out on Ragnar Records, mastered by Mikey Young). It's out on September 16, and thought it would be right up the alley for {{outlet}}.

Following our 7" which hit #3 on the Australian Independent Record Labels (AIR) charts and picked up radio spins on 4ZZZ, Triple R, and Radio Elance over in Spain, we'd love for you to give this new one a spin.

🎧 Full WAV Master: {{wav_url}}
🎨 Artwork: {{artwork_url}}
📖 Full EPK & Stream: {{epk_url}}

If you fancy playing it on {{outlet}} or would like an exclusive station ident/shoutout, just let me know!

Cheers,
Henry Collins
Love Banana
{{bandcamp_url}}`,
        created_at: new Date().toISOString()
      },
      {
        id: "tpl-2",
        name: `"Seagull" & Album Feature - Music Blog / Webzine`,
        target_category: "Blog",
        subject: `{{subject_variant}}`,
        body: `Hi {{first_name}},

Long-time reader of {{outlet}}. I'm Henry from the Sydney garage pop outfit Love Banana.

We're gearing up to drop our debut album 'Any Direction' later this year on Ragnar Records (mastered by Mikey Young). We wrote and tracked the records in a shed on the Gold Coast in the middle of a brutal heatwave before mixing it in Sydney.

Our lead single "Seagull" drops September 16. It leans into scuzzy garage punk while keeping the catchy, group-vocal pop hooks we're known for.

Given {{outlet}}'s taste for eclectic indie/garage sounds, we'd be stoked if you'd consider featuring the track or doing a quick write-up:

🎵 Private Stream & Press Kit: {{epk_url}}
💿 Hi-Res Press Photos & Artwork: {{album_url}}
📻 High-Res WAV Master: {{wav_url}}

Would love to know your thoughts if you get a few minutes to give it a listen!

Best,
Henry & the Love Banana crew
Sydney, Australia`,
        created_at: new Date().toISOString()
      },
      {
        id: "tpl-3",
        name: `Magazine / Print Zine Interview & Review Copy`,
        target_category: "Magazine",
        subject: `Album Review Copy & Interview: Love Banana ('Any Direction' LP)`,
        body: `Hey {{first_name}},

Reaching out from Sydney! I love what you guys are doing with {{outlet}}.

My band Love Banana has just wrapped our debut 13-track LP 'Any Direction', releasing on Ragnar Records. Along with our music, our keyboardist Paris Rodd handles all our handmade collages, animations, and zine-style art, as we come from a heavy DIY visual arts background.

Our debut 7" landed at #3 on the AIR Charts and Bandcamp Daily's Best Punk, and we've toured with Ty Segall, Babe Rainbow, Bananagun, and RMFC.

We'd love to send you a full advance album copy for review or chat about the Australian DIY scene:
- Full Album & EPK: {{epk_url}}
- High-res photo archive: https://drive.google.com/drive/folders/1mco7BjG2jaSqvCsZ1Td-z7kLybdg-CZ7

Let me know if you'd like a physical vinyl/cassette or digital advance stream sent through!

All the best,
Henry Collins`,
        created_at: new Date().toISOString()
      },
      {
        id: "tpl-4",
        name: `Friendly Follow-Up (5 Days No Reply)`,
        target_category: "Radio",
        subject: `Re: Love Banana — "Seagull" (Quick bump for {{outlet}})`,
        body: `Hey {{first_name}},

Just bumping this to the top of your inbox in case it got buried under the weekly promo deluge!

"Seagull" is ready to spin if you have room on your playlist this week: {{wav_url}}

Hope the shows are going great.

Cheers,
Henry`,
        created_at: new Date().toISOString()
      }
    ],
    contacts: [
      {
        id: "c-1",
        name: "Marc Riley",
        email: "marc.riley@bbc.co.uk",
        outlet: "BBC Radio 6 Music",
        category: "Radio",
        country: "United Kingdom",
        city: "Manchester",
        genre_fit: "Garage Rock, Post-Punk, Alt-Pop",
        notes: "Champion of scuzzy DIY indie & Aussie garage rock.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-2",
        name: "Steve Lamacq",
        email: "steve.lamacq@bbc.co.uk",
        outlet: "BBC Radio 6 Music",
        category: "Radio",
        country: "United Kingdom",
        city: "London",
        genre_fit: "Indie, Punk, DIY",
        notes: "Loves Australian garage and jangle punk.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-3",
        name: "John Kennedy",
        email: "john.kennedy@radiox.co.uk",
        outlet: "Radio X",
        category: "Radio",
        country: "United Kingdom",
        city: "London",
        genre_fit: "New Music, Indie Rock",
        notes: "X-Posure show host, great for emerging overseas bands.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-4",
        name: "Luc Frelon",
        email: "luc.frelon@radiofrance.com",
        outlet: "FIP Radio",
        category: "Radio",
        country: "France",
        city: "Paris",
        genre_fit: "Eclectic, Rock, Pop, Indie",
        notes: "Eclectic national French radio network with huge indie reach.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-5",
        name: "Stephan Rath",
        email: "stephan.rath@radioeins.de",
        outlet: "Radio Eins",
        category: "Radio",
        country: "Germany",
        city: "Berlin",
        genre_fit: "Indie Rock, Alternative",
        notes: "RBB Berlin - great alternative afternoon music shows.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-6",
        name: "Radio Elance Programming",
        email: "contacto@radioelance.com",
        outlet: "Radio Elance",
        category: "Radio",
        country: "Spain",
        city: "Barcelona",
        genre_fit: "Garage, Psych, Indie",
        notes: "Already spun previous 7 inch! Very warm target for 'Seagull'.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-7",
        name: "Raul Guillen",
        email: "raul@jenesaispop.com",
        outlet: "Jenesaispop",
        category: "Blog",
        country: "Spain",
        city: "Madrid",
        genre_fit: "Indie Pop, Garage Pop",
        notes: "Major Spanish independent music publication.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-8",
        name: "Robin Murray",
        email: "robin@clashmusic.com",
        outlet: "Clash Magazine",
        category: "Magazine",
        country: "United Kingdom",
        city: "London",
        genre_fit: "Indie, Punk, Underground",
        notes: "Editor-in-Chief, regularly covers Aussie garage/indie releases.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-9",
        name: "Chris Todd",
        email: "chris.todd@thelineofbestfit.com",
        outlet: "The Line of Best Fit",
        category: "Blog",
        country: "United Kingdom",
        city: "London",
        genre_fit: "Indie Pop, Alternative",
        notes: "Reviews editor, loves melodic garage pop.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-10",
        name: "Nathan Whittle",
        email: "nathan@louderthanwar.com",
        outlet: "Louder Than War",
        category: "Blog",
        country: "United Kingdom",
        city: "Manchester",
        genre_fit: "Garage Rock, Post-Punk",
        notes: "Loves scuzzy guitars and Bandcamp Daily favorites.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-11",
        name: "Subcity Music Team",
        email: "programming@subcity.org",
        outlet: "Subcity Radio",
        category: "Radio",
        country: "United Kingdom",
        city: "Glasgow",
        genre_fit: "Student, DIY, Indie",
        notes: "Autonomous Glasgow community/student station.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      },
      {
        id: "c-12",
        name: "ByteFM Redaktion",
        email: "redaktion@byte.fm",
        outlet: "ByteFM",
        category: "Radio",
        country: "Germany",
        city: "Hamburg",
        genre_fit: "Indie, Pop, Garage",
        notes: "Independent web and DAB+ radio across Germany.",
        stage: "lead",
        last_contacted_at: null,
        created_at: new Date().toISOString()
      }
    ],
    outbox: [],
    replies: [
      {
        id: "rep-1",
        contact_id: "c-6",
        gmail_thread_id: "thread-sim-1",
        from_email: "contacto@radioelance.com",
        from_name: "Radio Elance",
        subject: "Re: New Music from Sydney: Love Banana — \"Seagull\"",
        snippet: "Hey Henry! Great to hear from you again. Loved the 7\" and Seagull sounds huge with Mikey Young's mastering! We're adding it to rotation this Friday...",
        body: `Hey Henry!

Great to hear from you again. Loved the 7" and Seagull sounds huge with Mikey Young's mastering!

We're adding it to our prime afternoon rotation starting this Friday at 4pm CET. Would you be able to send over a quick 10-second station ident ("Hey this is Henry from Love Banana and you're listening to Radio Elance")?

Cheers from Barcelona!
Radio Elance Team`,
        received_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        is_read: false
      }
    ]
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    ensureDirectoryExists();
    if (!fs.existsSync(DB_FILE)) {
      if (fs.existsSync(SEED_FILE)) {
        try {
          const raw = fs.readFileSync(SEED_FILE, 'utf-8');
          this.data = JSON.parse(raw);
        } catch {
          this.data = getDefaultData();
        }
      } else {
        this.data = getDefaultData();
      }
      this.persist();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure keys exist
        if (!this.data.contacts) this.data.contacts = [];
        if (!this.data.templates) this.data.templates = [];
        if (!this.data.outbox) this.data.outbox = [];
        if (!this.data.replies) this.data.replies = [];
        if (!this.data.leads) this.data.leads = [];
        if (!this.data.settings) this.data.settings = {};
      } catch {
        this.data = getDefaultData();
        this.persist();
      }
    }
  }

  private persist() {
    ensureDirectoryExists();
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  // Contacts
  getContacts() {
    return this.data.contacts;
  }

  getContactById(id: string) {
    return this.data.contacts.find(c => c.id === id);
  }

  addContact(contact: Omit<Contact, 'id' | 'created_at'>) {
    const newContact: Contact = {
      ...contact,
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    this.data.contacts.unshift(newContact);
    this.persist();
    return newContact;
  }

  addContactsBulk(contacts: Array<Omit<Contact, 'id' | 'created_at'>>) {
    const added: Contact[] = [];
    for (const c of contacts) {
      // Check duplicate by email
      const existing = this.data.contacts.find(x => x.email.toLowerCase() === c.email.toLowerCase());
      if (existing) {
        // Update existing
        Object.assign(existing, c);
        added.push(existing);
      } else {
        const newContact: Contact = {
          ...c,
          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          created_at: new Date().toISOString()
        };
        this.data.contacts.unshift(newContact);
        added.push(newContact);
      }
    }
    this.persist();
    return added;
  }

  updateContact(id: string, updates: Partial<Contact>) {
    const contact = this.getContactById(id);
    if (!contact) return null;
    Object.assign(contact, updates);
    this.persist();
    return contact;
  }

  deleteContact(id: string) {
    this.data.contacts = this.data.contacts.filter(c => c.id !== id);
    this.data.outbox = this.data.outbox.filter(o => o.contact_id !== id);
    this.persist();
    return true;
  }

  // Templates
  getTemplates() {
    return this.data.templates;
  }

  getTemplateById(id: string) {
    return this.data.templates.find(t => t.id === id);
  }

  saveTemplate(tpl: Partial<PitchTemplate> & { name: string; subject: string; body: string }) {
    if (tpl.id) {
      const existing = this.getTemplateById(tpl.id);
      if (existing) {
        Object.assign(existing, tpl);
        this.persist();
        return existing;
      }
    }
    const newTpl: PitchTemplate = {
      id: `tpl-${Date.now()}`,
      name: tpl.name,
      target_category: tpl.target_category || 'Radio',
      subject: tpl.subject,
      body: tpl.body,
      created_at: new Date().toISOString()
    };
    this.data.templates.push(newTpl);
    this.persist();
    return newTpl;
  }

  deleteTemplate(id: string) {
    this.data.templates = this.data.templates.filter(t => t.id !== id);
    this.persist();
    return true;
  }

  // Outbox
  getOutbox() {
    return this.data.outbox;
  }

  getOutboxItem(id: string) {
    return this.data.outbox.find(o => o.id === id);
  }

  addOutboxItem(item: Omit<OutboxItem, 'id' | 'created_at'>) {
    const newItem: OutboxItem = {
      ...item,
      id: `out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    this.data.outbox.unshift(newItem);
    this.persist();
    return newItem;
  }

  updateOutboxItem(id: string, updates: Partial<OutboxItem>) {
    const item = this.getOutboxItem(id);
    if (!item) return null;
    Object.assign(item, updates);
    this.persist();
    return item;
  }

  deleteOutboxItem(id: string) {
    this.data.outbox = this.data.outbox.filter(o => o.id !== id);
    this.persist();
    return true;
  }

  clearOutbox(status?: OutboxItem['status']) {
    if (status) {
      this.data.outbox = this.data.outbox.filter(o => o.status !== status);
    } else {
      this.data.outbox = [];
    }
    this.persist();
    return true;
  }

  // Replies
  getReplies() {
    return this.data.replies;
  }

  addReply(reply: Omit<ReplyItem, 'id'>) {
    const newReply: ReplyItem = {
      ...reply,
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    this.data.replies.unshift(newReply);
    // Mark associated contact as replied
    if (newReply.contact_id) {
      this.updateContact(newReply.contact_id, { stage: 'replied' });
    }
    this.persist();
    return newReply;
  }

  markReplyRead(id: string) {
    const rep = this.data.replies.find(r => r.id === id);
    if (rep) {
      rep.is_read = true;
      this.persist();
    }
    return rep;
  }

  // Leads / Discovery
  getLeads(): DiscoveredLead[] {
    return this.data.leads || [];
  }

  getLeadById(id: string): DiscoveredLead | undefined {
    return (this.data.leads || []).find(l => l.id === id);
  }

  addLead(lead: Omit<DiscoveredLead, 'id' | 'discoveredAt'>): DiscoveredLead {
    if (!this.data.leads) this.data.leads = [];
    const newLead: DiscoveredLead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      discoveredAt: new Date().toISOString()
    };
    this.data.leads.unshift(newLead);
    this.persist();
    return newLead;
  }

  addLeadsBulk(leads: Array<Omit<DiscoveredLead, 'id' | 'discoveredAt'>>): DiscoveredLead[] {
    if (!this.data.leads) this.data.leads = [];
    const added: DiscoveredLead[] = [];
    for (const l of leads) {
      const existing = this.data.leads.find(x => 
        (l.pitchEmail && x.pitchEmail && x.pitchEmail.toLowerCase() === l.pitchEmail.toLowerCase()) ||
        (l.websiteUrl && x.websiteUrl && x.websiteUrl.toLowerCase().replace(/\/$/, '') === l.websiteUrl.toLowerCase().replace(/\/$/, '')) ||
        (l.outlet && x.outlet && x.outlet.toLowerCase() === l.outlet.toLowerCase())
      );
      if (existing) {
        Object.assign(existing, l);
        added.push(existing);
      } else {
        const newLead: DiscoveredLead = {
          ...l,
          id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          discoveredAt: new Date().toISOString()
        };
        this.data.leads.unshift(newLead);
        added.push(newLead);
      }
    }
    this.persist();
    return added;
  }

  updateLead(id: string, updates: Partial<DiscoveredLead>): DiscoveredLead | null {
    const lead = this.getLeadById(id);
    if (!lead) return null;
    Object.assign(lead, updates);
    this.persist();
    return lead;
  }

  deleteLead(id: string): boolean {
    if (!this.data.leads) return false;
    this.data.leads = this.data.leads.filter(l => l.id !== id);
    this.persist();
    return true;
  }

  approveLead(id: string): { lead: DiscoveredLead; contact: Contact } | null {
    const lead = this.getLeadById(id);
    if (!lead) return null;
    lead.status = 'approved';
    
    // Convert to contact
    const contactCategory = (['Radio', 'Blog', 'Magazine', 'Curator'].includes(lead.category) 
      ? lead.category 
      : 'Other') as Contact['category'];

    const newContact = this.addContact({
      name: lead.contactPerson || lead.name || lead.outlet,
      email: lead.pitchEmail || '',
      outlet: lead.outlet,
      role: lead.role,
      category: contactCategory,
      country: lead.country || 'International',
      city: lead.city || '',
      genre_fit: lead.vibeTags?.join(', ') || 'Garage Pop / Indie Rock',
      notes: `${lead.notes || ''} [Platform: ${lead.hostPlatform} | Source: ${lead.sourcePlatform} | Vibe: ${lead.vibeScore}%]`.trim(),
      stage: 'lead',
      last_contacted_at: null,
      affinityTier: lead.affinityTier,
      decision_record: lead.decision_record
    });

    this.persist();
    return { lead, contact: newContact };
  }

  clearLeads(status?: DiscoveredLead['status']): boolean {
    if (!this.data.leads) return true;
    if (status) {
      this.data.leads = this.data.leads.filter(l => l.status !== status);
    } else {
      this.data.leads = [];
    }
    this.persist();
    return true;
  }

  // Settings
  // On Vercel, /tmp is wiped on cold starts — env vars are the persistent source of truth
  // for credentials. getSettings() merges stored settings with env var overrides.
  getSettings(): Settings {
    const stored = this.data.settings as unknown as Settings;
    if (!IS_VERCEL) return stored;

    // Env var overrides — set these in Vercel Dashboard > Project Settings > Environment Variables
    const envOverrides: Partial<Settings> = {};
    if (process.env.GMAIL_USER)                    envOverrides.gmailUser = process.env.GMAIL_USER;
    if (process.env.GMAIL_APP_PASSWORD)            envOverrides.gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (process.env.SECONDARY_GMAIL_USER)          envOverrides.secondaryGmailUser = process.env.SECONDARY_GMAIL_USER;
    if (process.env.SECONDARY_GMAIL_APP_PASSWORD)  envOverrides.secondaryGmailAppPassword = process.env.SECONDARY_GMAIL_APP_PASSWORD;
    if (process.env.SECONDARY_FROM_EMAIL)          envOverrides.secondaryFromEmail = process.env.SECONDARY_FROM_EMAIL;
    if (process.env.SECONDARY_CONTACT_NAME)        envOverrides.secondaryContactName = process.env.SECONDARY_CONTACT_NAME;
    if (process.env.ACTIVE_GMAIL_ACCOUNT)          envOverrides.activeGmailAccount = process.env.ACTIVE_GMAIL_ACCOUNT as 'primary' | 'secondary';
    if (process.env.REPLY_TO_EMAIL)                envOverrides.replyToEmail = process.env.REPLY_TO_EMAIL;
    if (process.env.SIMULATION_MODE)               envOverrides.simulationMode = process.env.SIMULATION_MODE as 'true' | 'false';

    return { ...stored, ...envOverrides };
  }

  updateSettings(updates: Partial<Settings>) {
    Object.assign(this.data.settings, updates);
    this.persist();
    return this.getSettings();
  }

  // Dispatch State
  getDispatchState(): DispatchState {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.dispatch_state) {
      this.data.dispatch_state = {
        current_stage: 1,
        stage_start_date: today,
        daily_cap: 25,
        sent_today: 0,
        sent_today_date: today,
        bounced_today: 0,
        bounced_total: 0,
        sent_total: 0,
        last_batch_start_time: null,
        status: 'healthy'
      };
      this.persist();
    }
    // Auto reset daily counter if date rolled over
    if (this.data.dispatch_state.sent_today_date !== today) {
      this.data.dispatch_state.sent_today = 0;
      this.data.dispatch_state.sent_today_date = today;
      this.data.dispatch_state.bounced_today = 0;
      this.persist();
    }
    return this.data.dispatch_state;
  }

  updateDispatchState(updates: Partial<DispatchState>): DispatchState {
    const current = this.getDispatchState();
    Object.assign(current, updates);
    this.persist();
    return current;
  }
}

// Global instance
declare global {
  // eslint-disable-next-line no-var
  var _storeInstance: Store | undefined;
}

export function getStore(): Store {
  if (!global._storeInstance) {
    global._storeInstance = new Store();
  }
  return global._storeInstance;
}
