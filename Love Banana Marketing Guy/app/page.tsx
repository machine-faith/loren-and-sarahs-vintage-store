'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Inbox, 
  Users, 
  Upload, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Mail, 
  ExternalLink,
  X,
  Plus,
  Trash2,
  Check,
  CheckSquare,
  Square,
  MapPin,
  Globe,
  Search,
  ShieldCheck,
  Radio,
  FileText,
  Compass,
  Disc
} from 'lucide-react';
import { Contact, ReplyItem, Settings } from '@/lib/db';
import { parseContactsCsv } from '@/lib/csv-importer';
import { getContactProfile, renderPitchClient, ContactProfile } from '@/lib/contact-profile';
import DiscoveryView from '@/components/DiscoveryView';
import LabelDistroView from '@/components/LabelDistroView';
import MasterTemplatesView, { TemplateChannel, ChannelTemplateData } from '@/components/MasterTemplatesView';

// Location classifier helper
function getLocationCategory(contact: Contact): 'sydney' | 'australia' | 'international' {
  const city = (contact.city || '').toLowerCase();
  const country = (contact.country || '').toLowerCase();
  const notes = (contact.notes || '').toLowerCase();
  const outlet = (contact.outlet || '').toLowerCase();

  if (
    city.includes('sydney') || 
    notes.includes('sydney') || 
    outlet.includes('fbi') || 
    outlet.includes('2ser') ||
    notes.includes('local sydney')
  ) {
    return 'sydney';
  }

  if (
    country.includes('australia') || 
    city.includes('melbourne') || 
    city.includes('brisbane') || 
    city.includes('perth') || 
    city.includes('adelaide') ||
    outlet.includes('rrr') ||
    outlet.includes('4zzz') ||
    outlet.includes('pbs')
  ) {
    return 'australia';
  }

  return 'international';
}

function getLocationBadge(contact: Contact) {
  const loc = getLocationCategory(contact);
  if (loc === 'sydney') {
    return { label: '🦘 Sydney Local', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (loc === 'australia') {
    return { label: `🇦🇺 ${contact.city || 'Australia'}`, bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  }
  if ((contact.country || '').toLowerCase().includes('united kingdom') || (contact.country || '').toLowerCase().includes('uk')) {
    return { label: '🇬🇧 UK', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
  return { label: `🇪🇺 ${contact.country || 'Europe'}`, bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
}

const DEFAULT_RADIO_TEMPLATE: ChannelTemplateData = {
  subject: '{{subject_variant}}',
  body: `{{greeting}}

{{greeting_intro}} My name's Henry, from Love Banana, a five-piece garage pop band {{location_phrase}}.

We've just put out our debut single "Seagull" - it's a fast, upbeat track about beach birds stealing hot chips, recorded in Petersham and mastered by Owen Penglis (Straight Arrows). Off our debut LP 'Any Direction', coming out on Ragnar Records later this year.

{{story_hook}}

• WAV Master ("Seagull"): https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav
• Band EPK & Videos: https://love-banana-epk.vercel.app/epk.html
• Album Stream & WAV Downloads: https://love-banana-epk.vercel.app/album.html

{{ask_phrase}}

{{signoff_line}}

Cheers,
Henry Collins
Love Banana
{{from_email}}`
};

const DEFAULT_BLOG_TEMPLATE: ChannelTemplateData = {
  subject: '{{subject_variant}}',
  body: `{{greeting}}

{{greeting_intro}} My name's Henry, from Love Banana, a five-piece garage pop band {{location_phrase}}.

We've put out our debut single "Seagull" - fast, scuzzy garage pop about beach birds making off with your hot chips. Recorded in Petersham, mastered by Owen Penglis (Straight Arrows). It's the lead single off our debut LP 'Any Direction', coming out on Ragnar Records.

{{story_hook}}

• WAV Master ("Seagull"): https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav
• Band EPK & Videos: https://love-banana-epk.vercel.app/epk.html
• Album Stream & WAV Downloads: https://love-banana-epk.vercel.app/album.html

{{ask_phrase}}

{{signoff_line}}

Cheers,
Henry Collins
Love Banana
{{from_email}}`
};

const DEFAULT_LABEL_TEMPLATE: ChannelTemplateData = {
  subject: "Love Banana / debut LP (Michael Barker recommended we get in touch)",
  body: `{{salutation}}

Hope you're doing well. Reaching out from Sydney, Australia. I sing and play guitar in a garage pop / rock & roll five-piece called Love Banana.

{{connection_line}}

We're doing our digital release ourselves, but we're looking for an indie label partner to team up on a physical release (vinyl / tape) over your way. In Australia, Michael is pressing the records, sorting us with band copies for shows, and keeping the sales from the run. We'd love to do something similar over there to get the record into local shops and into people's hands.

The album has 13 tracks and was mastered by Mikey Young. We don't have a locked release date for the full album yet because we want to coordinate with our physical partners. The digital rollout starts with our first single "Seagull" dropping on September 16, followed by our second single "Fit For Motion" alongside an official music video.

On the live side, we're taking this global to back the record: we've already begun booking a European tour for October 2027, and we're currently putting together an American tour as well. Over here in Australia we've supported Ty Segall, Babe Rainbow, and Bananagun, and our debut 7" went to #3 on the Australian AIR indie charts.

You can stream the unreleased record and check out our links here:

Advance LP Stream: https://love-banana-epk.vercel.app/album.html
Lead Single ("Seagull" WAV Master): https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav
Band EPK: https://love-banana-epk.vercel.app/epk.html
Bandcamp: https://lovebanana.bandcamp.com/
Instagram: https://www.instagram.com/lovebanarna/

Give the album stream a listen when you have a minute and let us know if you think this could be a fit for your roster. No stress either way, really appreciate your time.

Cheers,
Henry Collins
Love Banana
lovebananaband@gmail.com`
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'send' | 'labels' | 'templates' | 'discovery' | 'replies' | 'contacts'>('send');
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [replies, setReplies] = useState<Array<ReplyItem & { contact?: Contact | null }>>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Master Channel Templates
  const [radioTemplate, setRadioTemplate] = useState<ChannelTemplateData>(DEFAULT_RADIO_TEMPLATE);
  const [blogTemplate, setBlogTemplate] = useState<ChannelTemplateData>(DEFAULT_BLOG_TEMPLATE);
  const [labelTemplate, setLabelTemplate] = useState<ChannelTemplateData>(DEFAULT_LABEL_TEMPLATE);

  // Dynamic presets derived from Master Templates
  const dynamicPresets = React.useMemo(() => [
    {
      id: 'sydney' as const,
      label: '🦘 Sydney Local Pitch',
      sublabel: 'Says: "based here in Sydney" + in-studio chats',
      targetLoc: 'sydney',
      subject: radioTemplate.subject,
      body: radioTemplate.body
    },
    {
      id: 'australia' as const,
      label: '🇦🇺 Australian National Pitch',
      sublabel: 'Says: "based in Sydney"',
      targetLoc: 'australia',
      subject: radioTemplate.subject,
      body: radioTemplate.body.includes('based here in Sydney')
        ? radioTemplate.body.replace('based here in Sydney', 'based in Sydney')
        : radioTemplate.body
    },
    {
      id: 'press' as const,
      label: '📝 Blog & Press Pitch',
      sublabel: 'Asks for track features & reviews (no radio spin wording)',
      targetLoc: 'press',
      subject: blogTemplate.subject,
      body: blogTemplate.body
    },
    {
      id: 'overseas' as const,
      label: '🌏 Overseas / Europe Pitch',
      sublabel: 'Says: "based in Sydney, Australia"',
      targetLoc: 'international',
      subject: radioTemplate.subject,
      body: radioTemplate.body.includes('based here in Sydney')
        ? radioTemplate.body.replace('based here in Sydney', 'based in Sydney, Australia')
        : radioTemplate.body.includes('based in Sydney')
        ? radioTemplate.body.replace('based in Sydney', 'based in Sydney, Australia')
        : radioTemplate.body
    }
  ], [radioTemplate, blogTemplate]);

  // Pitch Blaster state
  const [activePresetId, setActivePresetId] = useState<'overseas' | 'sydney' | 'australia' | 'press' | 'custom'>('sydney');
  const [subject, setSubject] = useState(DEFAULT_RADIO_TEMPLATE.subject);
  const [body, setBody] = useState(DEFAULT_RADIO_TEMPLATE.body);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<'all' | 'sydney' | 'australia' | 'press' | 'international'>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);

  // Send action state
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Replies state
  const [isCheckingReplies, setIsCheckingReplies] = useState(false);
  const [selectedReply, setSelectedReply] = useState<(ReplyItem & { contact?: Contact | null }) | null>(null);

  // Gmail Multi-Account State
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [activeGmailAccount, setActiveGmailAccount] = useState<'primary' | 'secondary'>('secondary');
  // Account 1 (Primary Band Account)
  const [gmailUser, setGmailUser] = useState('lovebananaband@gmail.com');
  const [gmailAppPassword, setGmailAppPassword] = useState('cgnj lder cgtq aclc');
  const [primaryContactName, setPrimaryContactName] = useState('Henry Collins');
  const [primaryAccountLabel, setPrimaryAccountLabel] = useState('Main Band Account (Love Banana)');
  // Account 2 (Secondary / Safe Outreach Account)
  const [secondaryGmailUser, setSecondaryGmailUser] = useState('lovebananacomms@gmail.com');
  const [secondaryGmailAppPassword, setSecondaryGmailAppPassword] = useState('');
  const [secondaryContactName, setSecondaryContactName] = useState('Henry Collins');
  const [secondaryAccountLabel, setSecondaryAccountLabel] = useState('Henry (Outreach Email)');
  const [savingGmail, setSavingGmail] = useState(false);

  const SETTINGS_STORAGE_KEY = 'love_banana_crm_settings';

  // Multi-layer persistence across localStorage, sessionStorage, and 1-year cookies
  const getStoredSettings = (): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    let data: Record<string, any> = {};

    const safeMerge = (source: Record<string, any>) => {
      for (const [k, v] of Object.entries(source)) {
        if (v !== undefined && v !== null && v !== '') {
          data[k] = v;
        } else if (data[k] === undefined) {
          data[k] = v;
        }
      }
    };

    // 1. Try localStorage
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') safeMerge(parsed);
      }
    } catch (e) {}

    // 2. Try sessionStorage
    try {
      const raw = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') safeMerge(parsed);
      }
    } catch (e) {}

    // 3. Try document.cookie
    try {
      const match = document.cookie.match(/(?:^|;\s*)lb_crm_settings=([^;]*)/);
      if (match && match[1]) {
        let parsed: any = null;
        try {
          parsed = JSON.parse(decodeURIComponent(match[1]));
        } catch {
          parsed = JSON.parse(match[1]);
        }
        if (parsed && typeof parsed === 'object') safeMerge(parsed);
      }
    } catch (e) {}

    return data;
  };

  const saveStoredSettings = (partial: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    const existing = getStoredSettings();
    const merged = { ...existing };
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined && v !== null) {
        // Protect passwords from accidental empty overwrites
        if ((k === 'secondaryGmailAppPassword' || k === 'gmailAppPassword') && v === '' && existing[k] && !partial._forceClear) {
          continue;
        }
        merged[k] = v;
      }
    }
    const str = JSON.stringify(merged);
    const encoded = encodeURIComponent(str);

    // 1. Save to localStorage
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, str);
    } catch (e) {}

    // 2. Save to sessionStorage
    try {
      sessionStorage.setItem(SETTINGS_STORAGE_KEY, str);
    } catch (e) {}

    // 3. Save to document.cookie (1 year duration)
    try {
      document.cookie = `lb_crm_settings=${encoded}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  };

  const updateLocalSettings = (partial: Record<string, any>) => {
    saveStoredSettings(partial);
  };

  // Contacts / Import state
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', outlet: '', category: 'Radio', city: '', country: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dispatch Warmup State
  const [dispatchState, setDispatchState] = useState<any>(null);

  useEffect(() => {
    // 1. Immediately hydrate from all stored layers (localStorage, sessionStorage, cookies)
    const stored = getStoredSettings();
    if (stored) {
      if (stored.secondaryGmailUser) setSecondaryGmailUser(stored.secondaryGmailUser);
      if (stored.secondaryGmailAppPassword) setSecondaryGmailAppPassword(stored.secondaryGmailAppPassword);
      if (stored.activeGmailAccount) setActiveGmailAccount(stored.activeGmailAccount);
      if (stored.secondaryContactName) setSecondaryContactName(stored.secondaryContactName);
      if (stored.secondaryAccountLabel) setSecondaryAccountLabel(stored.secondaryAccountLabel);
      if (stored.gmailUser) setGmailUser(stored.gmailUser);
      if (stored.gmailAppPassword) setGmailAppPassword(stored.gmailAppPassword);
      if (stored.contactName) setPrimaryContactName(stored.contactName);
      if (stored.primaryAccountLabel) setPrimaryAccountLabel(stored.primaryAccountLabel);
      setSettings(prev => ({
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
        gmailAppPassword: "cgnj lder cgtq aclc",
        secondaryGmailUser: "lovebananacomms@gmail.com",
        secondaryGmailAppPassword: stored.secondaryGmailAppPassword || "",
        secondaryFromEmail: "lovebananacomms@gmail.com",
        secondaryContactName: "Henry Collins",
        secondaryAccountLabel: "Henry (Outreach Email)",
        activeGmailAccount: stored.activeGmailAccount || "secondary",
        simulationMode: "false",
        ...(prev || {}),
        ...stored
      } as Settings));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsRes, repliesRes, settingsRes, dispatchRes, templatesRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/replies'),
        fetch('/api/settings'),
        fetch('/api/dispatch-state'),
        fetch('/api/templates')
      ]);

      const [contactsData, repliesData, settingsData, dispatchData, templatesData] = await Promise.all([
        contactsRes.json(),
        repliesRes.json(),
        settingsRes.json(),
        dispatchRes.json(),
        templatesRes.json()
      ]);

      if (dispatchData.state) {
        setDispatchState(dispatchData.state);
      }

      if (contactsData.contacts) {
        setContacts(contactsData.contacts);
        // Default to checking all contacts
        setSelectedContactIds(contactsData.contacts.map((c: Contact) => c.id));
        if (contactsData.contacts.length > 0) {
          setPreviewContactId(contactsData.contacts[0].id);
        }
      }

      if (repliesData.replies) {
        setReplies(repliesData.replies);
        if (repliesData.replies.length > 0) setSelectedReply(repliesData.replies[0]);
      }

      if (templatesData.templates && Array.isArray(templatesData.templates)) {
        const tpls: any[] = templatesData.templates;
        const rTpl = tpls.find(t => t.target_category === 'Radio' || t.id === 'tpl-syd');
        const bTpl = tpls.find(t => t.target_category === 'Blog' || t.id === 'tpl-press');
        const lTpl = tpls.find(t => t.target_category === 'Label' || t.id === 'tpl-label-distro');
        if (rTpl?.body) {
          setRadioTemplate({ subject: rTpl.subject, body: rTpl.body });
          setSubject(rTpl.subject);
          setBody(rTpl.body);
        }
        if (bTpl?.body) setBlogTemplate({ subject: bTpl.subject, body: bTpl.body });
        if (lTpl?.body) setLabelTemplate({ subject: lTpl.subject, body: lTpl.body });
      }

      if (settingsData.settings) {
        const s = settingsData.settings;
        const stored = getStoredSettings();

        // Safe merge: Client storage (localStorage/cookies) always guards against empty server fields
        const secUser = stored.secondaryGmailUser || s.secondaryGmailUser || 'lovebananacomms@gmail.com';
        const secPass = stored.secondaryGmailAppPassword || s.secondaryGmailAppPassword || '';
        const secName = stored.secondaryContactName || s.secondaryContactName || 'Henry Collins';
        const secLabel = stored.secondaryAccountLabel || s.secondaryAccountLabel || 'Henry (Outreach Email)';
        const secActive = stored.activeGmailAccount || s.activeGmailAccount || 'secondary';

        const gUser = stored.gmailUser || s.gmailUser || s.fromEmail || 'lovebananaband@gmail.com';
        const gPass = stored.gmailAppPassword || s.gmailAppPassword || 'cgnj lder cgtq aclc';
        const gName = stored.contactName || s.contactName || 'Henry Collins';
        const gLabel = stored.primaryAccountLabel || s.primaryAccountLabel || 'Main Band Account (Love Banana)';

        const mergedSettings: Settings = {
          ...s,
          gmailUser: gUser,
          gmailAppPassword: gPass,
          contactName: gName,
          primaryAccountLabel: gLabel,
          secondaryGmailUser: secUser,
          secondaryGmailAppPassword: secPass,
          secondaryContactName: secName,
          secondaryAccountLabel: secLabel,
          activeGmailAccount: secActive,
          simulationMode: (gPass || secPass) ? 'false' : 'true'
        };

        saveStoredSettings(mergedSettings);

        // If client has secondary App Password but server doesn't, automatically sync to server
        if (secPass && !s.secondaryGmailAppPassword) {
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secondaryGmailUser: secUser,
              secondaryGmailAppPassword: secPass,
              activeGmailAccount: secActive,
              secondaryContactName: secName,
              secondaryAccountLabel: secLabel,
              simulationMode: 'false'
            })
          }).catch(() => {});
        }

        setSettings(mergedSettings);
        setActiveGmailAccount(secActive);
        setGmailUser(gUser);
        setGmailAppPassword(gPass);
        setPrimaryContactName(gName);
        setPrimaryAccountLabel(gLabel);
        setSecondaryGmailUser(secUser);
        setSecondaryGmailAppPassword(secPass);
        setSecondaryContactName(secName);
        setSecondaryAccountLabel(secLabel);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts visible in checklist
  const visibleContacts = contacts.filter(c => {
    const prof = getContactProfile(c);
    if (locationFilter === 'press') {
      if (prof.outletType === 'Radio') return false;
    } else if (locationFilter !== 'all') {
      if (prof.locationCategory !== locationFilter) return false;
    }

    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.outlet.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        prof.outletType.toLowerCase().includes(q) ||
        prof.outletName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Contacts actually marked to be sent
  const contactsToSend = contacts.filter(c => selectedContactIds.includes(c.id));

  // Save Master Template handler (Updates DB, state, Send Blaster & Label Distro)
  const handleSaveMasterTemplate = async (channel: TemplateChannel, templateData: ChannelTemplateData) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          subject: templateData.subject,
          body: templateData.body
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save template');
      }

      if (channel === 'radio') {
        setRadioTemplate(templateData);
        if (activePresetId === 'sydney') {
          setSubject(templateData.subject);
          setBody(templateData.body);
        } else if (activePresetId === 'australia') {
          setSubject(templateData.subject);
          setBody(templateData.body.includes('based here in Sydney') ? templateData.body.replace('based here in Sydney', 'based in Sydney') : templateData.body);
        } else if (activePresetId === 'overseas') {
          setSubject(templateData.subject);
          setBody(templateData.body.replace('based here in Sydney', 'based in Sydney, Australia'));
        }
      } else if (channel === 'blog') {
        setBlogTemplate(templateData);
        if (activePresetId === 'press') {
          setSubject(templateData.subject);
          setBody(templateData.body);
        }
      } else if (channel === 'label') {
        setLabelTemplate(templateData);
      }

      setBannerMessage(`✅ Master ${channel.toUpperCase()} template saved! All active drafts & subsequent emails have been updated.`);
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  // Switch template preset
  const handleSelectPreset = (presetId: 'overseas' | 'sydney' | 'australia' | 'press') => {
    const preset = dynamicPresets.find(p => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    setSubject(preset.subject);
    setBody(preset.body);

    // Auto-select matching contacts for this preset
    let matching: Contact[] = [];
    if (presetId === 'press') {
      matching = contacts.filter(c => {
        const prof = getContactProfile(c);
        return prof.outletType === 'Blog' || prof.outletType === 'Magazine' || prof.outletType === 'Writer/Critic' || prof.outletType === 'Curator';
      });
      setLocationFilter('press');
    } else if (presetId === 'sydney') {
      matching = contacts.filter(c => getLocationCategory(c) === 'sydney');
      setLocationFilter('sydney');
    } else if (presetId === 'australia') {
      matching = contacts.filter(c => getLocationCategory(c) === 'australia');
      setLocationFilter('australia');
    } else if (presetId === 'overseas') {
      matching = contacts.filter(c => getLocationCategory(c) === 'international');
      setLocationFilter('international');
    }

    if (matching.length > 0) {
      setSelectedContactIds(matching.map(c => c.id));
      setPreviewContactId(matching[0].id);
    }
  };

  // Toggle individual contact check
  const toggleContactCheck = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedContactIds(prev => [...prev, id]);
    }
    setPreviewContactId(id);
  };

  const handleSelectAllVisible = () => {
    const visibleIds = visibleContacts.map(c => c.id);
    setSelectedContactIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(visibleContacts.map(c => c.id));
    setSelectedContactIds(prev => prev.filter(id => !visibleIds.has(id)));
  };

  // Render preview for currently highlighted contact with full profiling
  const renderPreview = () => {
    const target = 
      contacts.find(c => c.id === previewContactId) || 
      contactsToSend[0] || 
      contacts[0] || {
        id: 'sample-1',
        name: 'FBi Radio Music Team',
        email: 'music@fbiradio.com',
        outlet: 'FBi Radio 94.5FM',
        category: 'Radio' as const,
        city: 'Sydney',
        country: 'Australia',
        genre_fit: 'garage pop / indie rock',
        notes: 'Local Sydney flagship community station',
        stage: 'lead' as const,
        last_contacted_at: null,
        created_at: new Date().toISOString()
      };

    const targetIndex = contacts.findIndex(c => c.id === target.id);
    const { subject: renderedSubject, body: renderedBody, profile } = renderPitchClient({
      templateSubject: subject,
      templateBody: body,
      contact: target,
      settings,
      seedIndex: targetIndex >= 0 ? targetIndex : 0
    });

    return { target, renderedSubject, renderedBody, profile };
  };

  // Blast send emails to ONLY selected contacts
  const handleBlastSend = async () => {
    if (contactsToSend.length === 0) {
      alert('Please check at least one contact to send to.');
      return;
    }

    setShowConfirmModal(false);
    setIsSending(true);

    try {
      // 1. Stage selected items into outbox with currently active subject and body
      await fetch('/api/outbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactIds: contactsToSend.map(c => c.id), 
          subject, 
          body 
        })
      });

      // 2. Fetch newly staged items
      const outRes = await fetch('/api/outbox?status=draft');
      const outData = await outRes.json();
      const ids = (outData.outbox || []).map((o: any) => o.id);

      // 3. Send in batches
      if (ids.length > 0) {
        const sendRes = await fetch('/api/outbox/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outboxIds: ids, delayMs: 1200 })
        });
        const sendData = await sendRes.json();
        if (sendData.failedCount > 0) {
          const firstErr = sendData.results?.find((r: any) => !r.success)?.error || 'Send error';
          setBannerMessage(`⚠️ ${sendData.sentCount} sent, ${sendData.failedCount} failed (${firstErr})`);
        } else {
          setBannerMessage(`🚀 Successfully sent ${sendData.sentCount} email${sendData.sentCount === 1 ? '' : 's'} directly via Gmail!`);
        }
      } else {
        setBannerMessage(`No emails in draft queue to send.`);
      }

      // Refresh contacts to show updated stage
      const cRes = await fetch('/api/contacts');
      const cData = await cRes.json();
      if (cData.contacts) setContacts(cData.contacts);

      setTimeout(() => setBannerMessage(null), 6000);
    } catch (err: any) {
      alert(`Send error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Push selected as Gmail drafts
  const handlePushDrafts = async () => {
    if (contactsToSend.length === 0) {
      alert('Please check at least one contact to draft for.');
      return;
    }

    // If using outreach channel, ensure secondary outreach account is linked
    const hasSecUser = Boolean(settings?.secondaryGmailUser || secondaryGmailUser);
    if (isSecondaryActive && !hasSecUser) {
      setShowGmailModal(true);
      setBannerMessage('⚠️ Please configure your separate outreach Gmail address below first.');
      return;
    }

    setIsDrafting(true);
    try {
      // Stage the outbox items — use the returned IDs directly (don't re-fetch globally)
      const stageRes = await fetch('/api/outbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactIds: contactsToSend.map(c => c.id), 
          subject, 
          body 
        })
      });
      const stageData = await stageRes.json();
      const ids: string[] = (stageData.created || []).map((o: any) => o.id).filter(Boolean);

      if (ids.length > 0) {
        const BATCH_SIZE = 15;
        let totalDrafted = 0;
        const stored = getStoredSettings();
        const secPass = settings?.secondaryGmailAppPassword || secondaryGmailAppPassword || stored?.secondaryGmailAppPassword || '';
        const secUser = settings?.secondaryGmailUser || secondaryGmailUser || stored?.secondaryGmailUser || 'lovebananacomms@gmail.com';
        const targetChannel = isSecondaryActive ? 'secondary' : 'primary';
        const targetAccountDisplay = targetChannel === 'secondary'
          ? (secUser || 'Outreach Gmail') 
          : (settings?.gmailUser || gmailUser || 'lovebananaband@gmail.com');

        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const chunk = ids.slice(i, i + BATCH_SIZE);
          const currentProgress = Math.min(i + chunk.length, ids.length);
          setBannerMessage(`📥 Pushing drafts to ${targetAccountDisplay}: ${currentProgress} of ${ids.length}...`);

          const draftRes = await fetch('/api/outbox/draft-in-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              outboxIds: chunk,
              channel: targetChannel,
              secondaryGmailUser: secUser,
              secondaryGmailAppPassword: secPass
            })
          });
          const draftData = await draftRes.json();
          if (!draftRes.ok) {
            if (draftData.needsConfig) {
              setShowGmailModal(true);
            }
            throw new Error(draftData.error || 'Failed to create drafts in Gmail');
          }
          if (draftData.results && draftData.results.length > 0 && draftData.draftedCount === 0 && !draftData.simulated) {
            const firstErr = draftData.results.find((r: any) => !r.success)?.error;
            throw new Error(firstErr || 'IMAP failed to append drafts. Please verify your Gmail App Password.');
          }
          totalDrafted += (draftData.draftedCount || chunk.length);
        }

        // Refresh dispatch warmup counters
        fetch('/api/dispatch-state')
          .then(r => r.json())
          .then(d => d.state && setDispatchState(d.state))
          .catch(() => {});

        setBannerMessage(`📥 Successfully pushed all ${totalDrafted} drafts into ${targetAccountDisplay} Drafts folder!`);
        setTimeout(() => setBannerMessage(null), 6000);
      } else {
        throw new Error('No outbox items were staged. Check that contacts are selected and try again.');
      }
    } catch (e: any) {
      alert(`Draft error: ${e.message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  // Check Replies
  const handleCheckReplies = async () => {
    setIsCheckingReplies(true);
    try {
      const res = await fetch('/api/replies', { method: 'POST' });
      const data = await res.json();
      if (data.replies) {
        setReplies(data.replies);
        if (data.replies.length > 0 && !selectedReply) {
          setSelectedReply(data.replies[0]);
        }
      }
      setBannerMessage(`Checked Gmail threads. ${data.newReplies || 0} new replies found.`);
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingReplies(false);
    }
  };

  // Simulate test reply
  const handleSimulateReply = async () => {
    try {
      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate' })
      });
      const data = await res.json();
      if (data.reply) {
        const rRes = await fetch('/api/replies');
        const rData = await rRes.json();
        if (rData.replies) {
          setReplies(rData.replies);
          setSelectedReply(rData.replies[0]);
        }
        setActiveTab('replies');
        setBannerMessage(`⚡️ Test reply from ${data.reply.from_name} arrived!`);
        setTimeout(() => setBannerMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick switch active sending account
  const handleQuickSwitchAccount = async (targetAccount: 'primary' | 'secondary') => {
    setActiveGmailAccount(targetAccount);
    saveStoredSettings({ activeGmailAccount: targetAccount });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeGmailAccount: targetAccount })
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({
          ...(prev || {}),
          ...data.settings,
          secondaryGmailUser: data.settings.secondaryGmailUser || prev?.secondaryGmailUser || secondaryGmailUser,
          secondaryGmailAppPassword: data.settings.secondaryGmailAppPassword || prev?.secondaryGmailAppPassword || secondaryGmailAppPassword
        }));
      }
      setBannerMessage(`Switched sending account to ${targetAccount === 'secondary' ? "Henry's Outreach Account (Channel 2)" : 'Main Band Account (Channel 1)'}`);
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (e: any) {
      console.error('Error switching account:', e);
    }
  };

  // Save Gmail Credentials for both accounts
  const handleSaveGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGmail(true);
    // If user filled in secondary Gmail, activate secondary channel as active outreach pathway
    const resolvedActive = secondaryGmailUser.trim() ? 'secondary' : 'primary';

    const payload = {
      activeGmailAccount: resolvedActive,
      gmailUser,
      gmailAppPassword,
      contactName: primaryContactName,
      primaryAccountLabel,
      secondaryGmailUser: secondaryGmailUser.trim(),
      secondaryGmailAppPassword: secondaryGmailAppPassword.trim(),
      secondaryContactName,
      secondaryAccountLabel,
      simulationMode: (gmailAppPassword.trim() || secondaryGmailAppPassword.trim()) ? 'false' : 'true'
    };

    saveStoredSettings(payload);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const merged = { ...(data?.settings || {}), ...payload };
      saveStoredSettings(merged);
      setSettings(merged);
      setActiveGmailAccount(resolvedActive);
      setGmailUser(merged.gmailUser || gmailUser);
      setSecondaryGmailUser(merged.secondaryGmailUser || secondaryGmailUser);
      setSecondaryGmailAppPassword(merged.secondaryGmailAppPassword || secondaryGmailAppPassword);
      setShowGmailModal(false);
      setBannerMessage(resolvedActive === 'secondary' && secondaryGmailUser.trim()
        ? `✅ Saved! Dispatches now routed through Henry's Outreach Account (${secondaryGmailUser.trim()}).`
        : '✅ Gmail accounts saved successfully!'
      );
      setTimeout(() => setBannerMessage(null), 6000);
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setSavingGmail(false);
    }
  };

  // CSV Import handler
  const handleImportSubmit = async (textToImport: string) => {
    if (!textToImport.trim()) return;
    setIsImporting(true);
    try {
      const parsed = parseContactsCsv(textToImport);
      if (parsed.contacts.length === 0) {
        alert('No valid contacts found in CSV.');
        return;
      }

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsed.contacts })
      });
      const data = await res.json();
      
      const cRes = await fetch('/api/contacts');
      const cData = await cRes.json();
      if (cData.contacts) {
        setContacts(cData.contacts);
        setSelectedContactIds(cData.contacts.map((c: Contact) => c.id));
      }

      setCsvText('');
      setBannerMessage(`✅ Successfully imported ${data.importedCount || parsed.contacts.length} contacts!`);
      setTimeout(() => setBannerMessage(null), 4000);
      setActiveTab('send');
    } catch (e: any) {
      alert(`Import error: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedContactIds(prev => prev.filter(x => x !== id));
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) return;

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    });
    const data = await res.json();
    if (data.contact) {
      setContacts(prev => [data.contact, ...prev]);
      setSelectedContactIds(prev => [data.contact.id, ...prev]);
      setShowAddContact(false);
      setNewContact({ name: '', email: '', outlet: '', category: 'Radio', city: '', country: '' });
      setBannerMessage(`Added ${data.contact.name}!`);
      setTimeout(() => setBannerMessage(null), 3000);
    }
  };

  const unreadReplies = replies.filter(r => !r.is_read).length;
  const preview = renderPreview();

  const hasSecondaryUser = Boolean(settings?.secondaryGmailUser || secondaryGmailUser);
  const isSecondaryActive = activeGmailAccount === 'secondary';
  const currentSenderEmail = isSecondaryActive 
    ? (settings?.secondaryGmailUser || secondaryGmailUser || 'lovebananacomms@gmail.com')
    : (settings?.gmailUser || gmailUser || 'lovebananaband@gmail.com');
  const currentSenderName = isSecondaryActive
    ? (settings?.secondaryContactName || secondaryContactName || 'Henry Collins')
    : (settings?.contactName || primaryContactName || 'Henry Collins');
  const isSecondaryConnected = Boolean(
    (settings?.secondaryGmailAppPassword && settings?.secondaryGmailUser) ||
    (secondaryGmailAppPassword && secondaryGmailUser) ||
    (hasSecondaryUser && (settings?.gmailAppPassword || gmailAppPassword)) ||
    hasSecondaryUser
  );
  const isPrimaryConnected = Boolean((settings?.gmailAppPassword || gmailAppPassword) && (settings?.gmailUser || gmailUser));
  const isGmailConnected = isSecondaryActive ? isSecondaryConnected : isPrimaryConnected;

  return (
    <div className="min-h-screen bg-[#24262c] text-[#d6d9e0] flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      
      {/* Ableton Live Top Transport & Channel Header */}
      <header className="sticky top-0 z-40 bg-[#2d3037] border-b border-[#434754] shadow-md w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-2">
            
            {/* Ableton Logo & Engine State Indicator */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="w-8 h-8 rounded bg-[#ff761a] text-[#121316] flex items-center justify-center font-black text-sm shadow-sm border border-[#ff8d3b]" title="Messenger Pigeon on Steroids">
                🕊️
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-white text-[11px] sm:text-xs tracking-wider uppercase font-mono">
                    MESSENGER PIGEON
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider bg-[#1b1d22] text-[#ff761a] px-1 py-0.2 rounded border border-[#434754]">
                    STEROIDS
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[9.5px] text-[#9ca0ae] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f044] shadow-[0_0_5px_#00f044] inline-block" />
                  <span className="text-[#a0a5b4]">LOVE BANANA DISPATCH</span>
                </div>
              </div>
            </div>

            {/* Desktop Tabs Selector */}
            <div className="hidden md:flex items-center bg-[#1c1e24] p-1 rounded border border-[#3e424f] shadow-inner shrink-0">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition tracking-wide ${
                  activeTab === 'send'
                    ? 'bg-[#ff761a] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND PITCH</span>
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition tracking-wide ${
                  activeTab === 'labels'
                    ? 'bg-[#00d4ff] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>LABEL DISTRO</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition tracking-wide ${
                  activeTab === 'templates'
                    ? 'bg-[#ffd000] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MASTER TEMPLATES</span>
              </button>

              <button
                onClick={() => setActiveTab('replies')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold transition tracking-wide relative ${
                  activeTab === 'replies'
                    ? 'bg-[#00f044] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>INBOX REPLIES</span>
                {unreadReplies > 0 && (
                  <span className="ml-1 bg-[#ff3333] text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full">
                    {unreadReplies}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('discovery')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition tracking-wide ${
                  activeTab === 'discovery'
                    ? 'bg-[#ffd000] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>DISCOVERY</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition tracking-wide ${
                  activeTab === 'contacts'
                    ? 'bg-[#50a8ff] text-[#121316] shadow-sm font-extrabold'
                    : 'text-[#a6abb8] hover:text-white hover:bg-[#2b2d35]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>CONTACTS ({contacts.length})</span>
              </button>
            </div>

            {/* Warmup Dispatch Safety Badge (Desktop) */}
            {dispatchState && (
              <div 
                onClick={() => setShowGmailModal(true)}
                className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10.5px] font-mono font-bold border cursor-pointer transition ${
                  dispatchState.status === 'frozen'
                    ? 'bg-[#ff3333]/15 text-[#ff3333] border-[#ff3333]/40'
                    : dispatchState.status === 'paused'
                    ? 'bg-[#ffd000]/15 text-[#ffd000] border-[#ffd000]/40'
                    : 'bg-[#00f044]/10 text-[#00f044] border-[#00f044]/30'
                }`}
                title={`Warmup Stage ${dispatchState.current_stage} | Daily Cap: ${dispatchState.daily_cap} | Sent Today: ${dispatchState.sent_today} | Status: ${dispatchState.status.toUpperCase()}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  dispatchState.status === 'frozen'
                    ? 'bg-[#ff3333] animate-ping'
                    : dispatchState.status === 'paused'
                    ? 'bg-[#ffd000]'
                    : 'bg-[#00f044]'
                }`} />
                <span>WARMUP S{dispatchState.current_stage}</span>
                <span className="text-[#a6abb8]">|</span>
                <span>{dispatchState.sent_today}/{dispatchState.daily_cap} TODAY</span>
                <span className="text-[9px] uppercase px-1 rounded bg-[#121316] font-extrabold ml-0.5">
                  {dispatchState.status}
                </span>
              </div>
            )}

            {/* Desktop Channel Strip Switcher & Controls (Only on screens >= md) */}
            <div className="hidden md:flex items-center space-x-2 shrink-0">
              <div className="flex items-center bg-[#1c1e24] border border-[#3e424f] rounded p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickSwitchAccount('primary')}
                  className={`px-2 py-1 rounded text-[10.5px] font-bold font-mono transition flex items-center space-x-1 ${
                    !isSecondaryActive
                      ? 'bg-[#ff761a] text-[#121316] shadow-sm font-black'
                      : 'text-[#9ca0ae] hover:text-white'
                  }`}
                  title="Send from Primary Band Account (Henry Collins)"
                >
                  <span>CH 1: MAIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasSecondaryUser) {
                      setShowGmailModal(true);
                    } else {
                      handleQuickSwitchAccount('secondary');
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10.5px] font-bold font-mono transition flex items-center space-x-1 ${
                    isSecondaryActive
                      ? 'bg-[#00f044] text-[#121316] shadow-sm font-black'
                      : 'text-[#9ca0ae] hover:text-white'
                  }`}
                  title={hasSecondaryUser ? "Send as Henry via Outreach Account" : "Setup Henry's Secondary Outreach Account"}
                >
                  <span>CH 2</span>
                  {!hasSecondaryUser && (
                    <span className="text-[8.5px] bg-[#00f044]/20 text-[#00f044] px-1 rounded font-mono">+LINK</span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowGmailModal(true)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold border transition ${
                  isGmailConnected
                    ? 'bg-[#1c1e24] text-[#00f044] border-[#3e424f] hover:border-[#00f044]'
                    : 'bg-[#1c1e24] text-[#ff761a] border-[#3e424f] hover:border-[#ff761a]'
                }`}
                title="Manage Linked Gmail Accounts"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px]">
                  {isSecondaryActive ? 'OUTREACH' : 'MAIN GMAIL'}
                </span>
              </button>

              <button
                onClick={handleCheckReplies}
                disabled={isCheckingReplies}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold bg-[#353843] hover:bg-[#3f4350] text-[#d6d9e0] border border-[#484c5a] transition"
                title="Sync Gmail inbox for new DJ/press replies"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#a0a5b4] ${isCheckingReplies ? 'animate-spin text-[#00f044]' : ''}`} />
                <span className="font-mono text-[10px]">{isCheckingReplies ? '...' : 'SYNC'}</span>
              </button>
            </div>

            {/* Mobile Top-Right Controls (Only on screens < md) */}
            <div className="flex md:hidden items-center space-x-1.5 shrink-0">
              {/* Compact Warmup Pill */}
              {dispatchState && (
                <div 
                  onClick={() => setShowGmailModal(true)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border cursor-pointer ${
                    dispatchState.status === 'frozen'
                      ? 'bg-[#ff3333]/20 text-[#ff3333] border-[#ff3333]/40'
                      : dispatchState.status === 'paused'
                      ? 'bg-[#ffd000]/20 text-[#ffd000] border-[#ffd000]/40'
                      : 'bg-[#1c1e24] text-[#00f044] border-[#3e424f]'
                  }`}
                  title={`Stage ${dispatchState.current_stage}: ${dispatchState.sent_today}/${dispatchState.daily_cap} sent today`}
                >
                  S{dispatchState.current_stage}:{dispatchState.sent_today}/{dispatchState.daily_cap}
                </div>
              )}
              {/* Compact Channel Badge */}
              <button
                type="button"
                onClick={() => {
                  if (hasSecondaryUser) {
                    handleQuickSwitchAccount(isSecondaryActive ? 'primary' : 'secondary');
                  } else {
                    setShowGmailModal(true);
                  }
                }}
                className={`px-2 py-1 rounded text-[10.5px] font-mono font-bold transition flex items-center space-x-1 border ${
                  isSecondaryActive
                    ? 'bg-[#1c1e24] text-[#00f044] border-[#00f044]/40 shadow-sm'
                    : 'bg-[#1c1e24] text-[#ff761a] border-[#ff761a]/40 shadow-sm'
                }`}
                title="Tap to switch sending account or configure"
              >
                <span>{isSecondaryActive ? 'CH 2' : 'CH 1'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSecondaryActive ? 'bg-[#00f044]' : 'bg-[#ff761a]'}`} />
              </button>

              {/* Gmail Accounts Config Button */}
              <button
                type="button"
                onClick={() => setShowGmailModal(true)}
                className="p-1.5 rounded bg-[#1c1e24] border border-[#3e424f] text-[#ff761a] hover:text-white transition"
                title="Gmail Account Settings"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>

              {/* Sync Button */}
              <button
                type="button"
                onClick={handleCheckReplies}
                disabled={isCheckingReplies}
                className="p-1.5 rounded bg-[#353843] border border-[#484c5a] text-[#d6d9e0] hover:text-white transition"
                title="Sync Inbox"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#a0a5b4] ${isCheckingReplies ? 'animate-spin text-[#00f044]' : ''}`} />
              </button>
            </div>

          </div>

          {/* Mobile 6-Tab Segmented Rack (Only visible on screens < md) */}
          <div className="md:hidden pb-2.5 pt-1">
            <div className="grid grid-cols-6 bg-[#1c1e24] p-1 rounded-md border border-[#3e424f] gap-0.5 text-center shadow-inner">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate ${
                  activeTab === 'send'
                    ? 'bg-[#ff761a] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <Send className="w-3 h-3 shrink-0" />
                <span className="truncate">SEND</span>
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate ${
                  activeTab === 'labels'
                    ? 'bg-[#00d4ff] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <Disc className="w-3 h-3 shrink-0" />
                <span className="truncate">LABELS</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate ${
                  activeTab === 'templates'
                    ? 'bg-[#ffd000] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">TPL</span>
              </button>

              <button
                onClick={() => setActiveTab('replies')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate relative ${
                  activeTab === 'replies'
                    ? 'bg-[#00f044] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <Inbox className="w-3 h-3 shrink-0" />
                <span className="truncate">INBOX</span>
                {unreadReplies > 0 && (
                  <span className="ml-0.5 bg-[#ff3333] text-white text-[8px] font-black px-1 rounded-full">
                    {unreadReplies}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('discovery')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate ${
                  activeTab === 'discovery'
                    ? 'bg-[#ffd000] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 shrink-0" />
                <span className="truncate">FIND</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded text-[10px] font-mono font-bold transition truncate ${
                  activeTab === 'contacts'
                    ? 'bg-[#50a8ff] text-[#121316] shadow-sm font-black'
                    : 'text-[#a6abb8] hover:text-white'
                }`}
              >
                <Users className="w-3 h-3 shrink-0" />
                <span className="truncate">LIST</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Global Notification Banner */}
      {bannerMessage && (
        <div className="bg-[#ff761a] text-[#121316] text-xs font-extrabold px-4 py-2 text-center flex items-center justify-center space-x-2 shadow-sm border-b border-[#e66009]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="tracking-wide">{bannerMessage}</span>
          <button onClick={() => setBannerMessage(null)} className="ml-3 font-bold underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">

        {/* ========================================================= */}
        {/* TAB 1: SEND PITCH (ABLETON SESSION VIEW & DEVICE RACKS)   */}
        {/* ========================================================= */}
        {activeTab === 'send' && (
          <div className="space-y-5">
            
            {/* 1. Ableton Device Rack 01: Pitch Tone & Clip Launcher */}
            <div className="bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden">
              <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-1.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff761a] shadow-[0_0_5px_#ff761a] inline-block" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
                    CLIP LAUNCHER: PITCH PRESETS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#a6abb8] uppercase hidden sm:inline">
                  ACTIVE: {dynamicPresets.find(p => p.id === activePresetId)?.label}
                </span>
              </div>

              {/* Ableton Session View Clip Slots */}
              <div className="p-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#24262c]">
                {dynamicPresets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  const clipBorderColor = 
                    preset.id === 'sydney' ? 'border-l-[#ff761a]' :
                    preset.id === 'australia' ? 'border-l-[#ffd000]' :
                    preset.id === 'press' ? 'border-l-[#ff6088]' : 'border-l-[#50a8ff]';

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id as any)}
                      className={`p-2 rounded bg-[#2e3138] border border-[#3e424f] border-l-4 ${clipBorderColor} text-left cursor-pointer transition shadow-sm space-y-0.5 ${
                        isActive
                          ? 'bg-[#363943] ring-1 ring-[#ff761a]'
                          : 'hover:bg-[#343740]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-white flex items-center gap-1.5 truncate">
                          <span className={isActive ? 'text-[#00f044]' : 'text-[#696e7e]'}>▶</span>
                          <span className="truncate">{preset.label}</span>
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00f044] shadow-[0_0_4px_#00f044] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#9ca0ae] truncate">
                        {preset.sublabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Main Two-Column View: Composer + Recipient Selector + Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Recipient Checklist & Email Composer */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Step 2: Ableton Device Rack 02: Audience & Recipient Matrix */}
                <div className="bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden space-y-0">
                  <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff761a] shadow-[0_0_5px_#ff761a] inline-block" />
                      <h3 className="text-[11px] font-black text-white uppercase tracking-wider font-mono">
                        RECIPIENT MATRIX ({contacts.length} TOTAL)
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-[#00f044] bg-[#1a1c22] px-2 py-0.5 rounded border border-[#383b46]">
                        {contactsToSend.length} / {contacts.length} ACTIVE IN QUEUE
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 bg-[#282a31]">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
                      <div className="relative w-full sm:flex-1">
                        <Search className="w-3.5 h-3.5 text-[#888d9d] absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search contact, station, city, outlet..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="w-full bg-[#18191f] border border-[#3b3e4a] rounded pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-[#707584] focus:outline-none focus:border-[#ff761a] font-mono"
                        />
                      </div>

                      {/* Quick check/uncheck all */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllVisible}
                          className="px-2.5 py-1 rounded text-[10.5px] font-bold bg-[#383c46] hover:bg-[#434754] text-[#d6d9e0] border border-[#484c5b] transition font-mono uppercase"
                        >
                          ALL
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllVisible}
                          className="px-2.5 py-1 rounded text-[10.5px] font-bold bg-[#383c46] hover:bg-[#434754] text-[#9ca0ae] hover:text-white border border-[#484c5b] transition font-mono uppercase"
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>

                    {/* Ableton Segmented Location & Channel Filters */}
                    <div className="flex items-center space-x-1 bg-[#1c1e24] p-1 rounded border border-[#383b46] text-[11px] overflow-x-auto">
                      {[
                        { id: 'all', label: `ALL (${contacts.length})` },
                        { id: 'sydney', label: '🦘 SYDNEY' },
                        { id: 'australia', label: '🇦🇺 AUSTRALIA' },
                        { id: 'press', label: '📝 PRESS & BLOGS' },
                        { id: 'international', label: '🌏 OVERSEAS' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLocationFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition whitespace-nowrap ${
                            locationFilter === f.id
                              ? 'bg-[#ff761a] text-[#121316]'
                              : 'text-[#9ca0ae] hover:text-white hover:bg-[#2e313a]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Recipient Checkbox List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-[#32353f] rounded bg-[#1a1c22] border border-[#383b46] p-1">
                      {visibleContacts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#808595] italic font-mono">
                          NO CONTACTS MATCH CURRENT FILTER.
                        </div>
                      ) : (
                        visibleContacts.map((contact) => {
                          const isChecked = selectedContactIds.includes(contact.id);
                          const isPreviewed = previewContactId === contact.id;
                          const badge = getLocationBadge(contact);
                          const prof = getContactProfile(contact);

                          return (
                            <div
                              key={contact.id}
                              onClick={() => setPreviewContactId(contact.id)}
                              className={`p-2 rounded cursor-pointer transition flex items-center justify-between gap-3 text-xs ${
                                isPreviewed 
                                  ? 'bg-[#353843] border border-[#ff761a]/60 shadow-sm' 
                                  : 'hover:bg-[#25272e]'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleContactCheck(contact.id);
                                  }}
                                  className="shrink-0 text-[#8e93a2] hover:text-white"
                                >
                                  {isChecked ? (
                                    <span className="w-4 h-4 rounded bg-[#00f044] text-[#121316] font-black text-[10px] flex items-center justify-center">✓</span>
                                  ) : (
                                    <span className="w-4 h-4 rounded border border-[#4d5160] block bg-[#202228]" />
                                  )}
                                </button>

                                <div className="truncate">
                                  <span className={`font-bold text-xs truncate ${isChecked ? 'text-white' : 'text-[#707584] line-through'}`}>
                                    {contact.name}
                                  </span>
                                  <span className="text-[11px] text-[#9ca0ae] ml-1.5 truncate font-mono">
                                    {contact.outlet}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${prof.tierBadge.border} ${prof.tierBadge.bg} ${prof.tierBadge.text}`}>
                                  {prof.tierBadge.label.split(' ')[0]} {prof.affinityTier === 'tier1_bullseye' ? 'BULLS-EYE' : prof.affinityTier === 'tier2_indie' ? 'INDIE' : 'ECLECTIC'}
                                </span>
                                {prof.outletType !== 'Radio' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border border-[#ff6088]/40 bg-[#ff6088]/15 text-[#ff80a0]">
                                    {prof.outletType}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-[#434754] bg-[#24262c] text-[#c6cad5]">
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: Ableton Device Rack 03: Pitch Console & Gmail Router */}
                <div className="bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden space-y-0">
                  <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#00f044] shadow-[0_0_5px_#00f044] inline-block" />
                      <h3 className="text-[11px] font-black text-white uppercase tracking-wider font-mono">
                        PITCH CONSOLE & DISPATCH
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#ffa020] bg-[#1a1c22] px-2 py-0.5 rounded border border-[#383b46]">
                      ACTIVE SENDER: {isSecondaryActive ? 'CH 2 (OUTREACH)' : 'CH 1 (MAIN BAND)'}
                    </span>
                  </div>

                  <div className="p-4 space-y-4 bg-[#282a31]">
                    {/* 1-Click Sending Channel Selector */}
                    <div className="bg-[#1c1e24] border border-[#383b46] rounded p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#a6abb8] uppercase tracking-wider flex items-center gap-1.5">
                          <span>ROUTED OUTGOING CHANNEL:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowGmailModal(true)}
                          className="text-[10px] font-mono text-[#ff761a] hover:underline flex items-center gap-1 uppercase font-bold"
                        >
                          <span>CONFIG ACCOUNTS</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Channel 1: Henry Main */}
                        <button
                          type="button"
                          onClick={() => handleQuickSwitchAccount('primary')}
                          className={`p-2.5 rounded border text-left transition space-y-1 ${
                            !isSecondaryActive
                              ? 'bg-[#353843] border-[#ff761a] ring-1 ring-[#ff761a]'
                              : 'bg-[#22242b] border-[#383b46] hover:border-[#4d5160]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>🍌 CH 1: Henry (Main Band)</span>
                              {!isSecondaryActive && <span className="w-2 h-2 rounded-full bg-[#ff761a] inline-block" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8e93a2] font-mono truncate">
                            {settings?.gmailUser || 'lovebananaband@gmail.com'}
                          </p>
                        </button>

                        {/* Channel 2: Henry Secondary */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasSecondaryUser) {
                              setShowGmailModal(true);
                            } else {
                              handleQuickSwitchAccount('secondary');
                            }
                          }}
                          className={`p-2.5 rounded border text-left transition space-y-1 ${
                            isSecondaryActive
                              ? 'bg-[#353843] border-[#00f044] ring-1 ring-[#00f044]'
                              : 'bg-[#22242b] border-[#383b46] hover:border-[#4d5160]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>⚡ CH 2: Henry (Outreach Email)</span>
                              {isSecondaryActive && <span className="w-2 h-2 rounded-full bg-[#00f044] shadow-[0_0_6px_#00f044] inline-block" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8e93a2] font-mono truncate">
                            {settings?.secondaryGmailUser || secondaryGmailUser || '+ Connect Outreach Gmail'}
                          </p>
                        </button>
                      </div>

                      {isSecondaryActive ? (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-[#00f044] bg-[#00f044]/10 px-2.5 py-1.5 rounded border border-[#00f044]/30 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span><strong>OUTREACH ACCOUNT ACTIVE:</strong> Dispatches as Henry Collins from your secondary Gmail. Protects your main band inbox (<code className="text-[#ffa020]">lovebananaband@gmail.com</code>) from cold outreach throttling.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-[#ff761a] bg-[#ff761a]/10 px-2.5 py-1.5 rounded border border-[#ff761a]/30 font-mono">
                          <span>💡 <strong>MAIN BAND ACCOUNT ACTIVE:</strong> Pitching directly as Henry from your primary inbox. Switch to CH 2 to route via your secondary email.</span>
                        </div>
                      )}
                    </div>

                    {/* Subject line input */}
                    <div>
                      <label className="block text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8] mb-1">
                        SUBJECT LINE
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-3 py-2 text-xs text-[#ffa020] font-mono focus:outline-none focus:border-[#ff761a]"
                      />
                    </div>

                    {/* Body textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8]">
                          EMAIL BODY CONSOLE
                        </label>
                        <span className="text-[10.5px] text-[#8e93a2] font-mono">
                          TOKENS: &#123;&#123;first_name&#125;&#125;, &#123;&#123;outlet&#125;&#125;
                        </span>
                      </div>
                      <textarea
                        rows={11}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full bg-[#18191f] border border-[#3b3e4a] rounded p-3 text-xs text-[#d6d9e0] focus:outline-none focus:border-[#ff761a] leading-relaxed font-sans"
                      />
                    </div>

                    {/* Ableton Master Draft Trigger with Safety Lock */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#3b3e4a]">
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-[#00f044] bg-[#00f044]/10 border border-[#00f044]/30 px-3 py-2 rounded">
                        <ShieldCheck className="w-4 h-4 text-[#00f044] shrink-0" />
                        <span>SAFETY LOCK ACTIVE: Direct sending disabled. Push to Drafts to review and send from your phone.</span>
                      </div>

                      <button
                        type="button"
                        onClick={handlePushDrafts}
                        disabled={isDrafting || contactsToSend.length === 0}
                        className="w-full sm:w-auto px-6 py-2.5 rounded text-xs font-mono font-black bg-[#00d4ff] hover:bg-[#20dcff] text-[#121316] shadow-sm border border-[#00d4ff] transition flex items-center justify-center space-x-2 uppercase tracking-wide disabled:opacity-50"
                      >
                        <Mail className="w-4 h-4 text-[#121316]" />
                        <span>{isDrafting ? 'PUSHING TO DRAFTS...' : `PUSH (${contactsToSend.length}) TO GMAIL DRAFTS`}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Live Preview & Contact Profile Inspector */}
              <div className="lg:col-span-5 bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden space-y-0 sticky top-20">
                <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-1.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#ffd000] shadow-[0_0_5px_#ffd000] inline-block" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
                      LIVE PREVIEW INSPECTOR
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border ${preview.profile.tierBadge.border} ${preview.profile.tierBadge.bg} ${preview.profile.tierBadge.text}`}>
                      {preview.profile.tierBadge.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border border-[#ffd000]/40 bg-[#ffd000]/15 text-[#ffd000]">
                      {preview.profile.outletType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border border-[#00f044]/40 bg-[#00f044]/15 text-[#00f044]" title={preview.profile.angleDescription}>
                      {preview.profile.angleDescription}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border border-[#434754] bg-[#1a1c22] text-[#d6d9e0]">
                      {preview.profile.locationBadge.label}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-3 bg-[#282a31]">
                  {/* Ableton Hardware LCD Parameter Strip */}
                  <div className="bg-[#141519] border border-[#383b48] rounded px-3 py-1.5 text-[11px] font-mono flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#a0a5b4] truncate">
                      <span className="text-[#ffa020] font-bold">"{preview.profile.greeting}"</span>
                      <span className="text-[#555968]">|</span>
                      <span className="text-white font-semibold truncate">{preview.profile.outletName || 'Independent'}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      preview.profile.angleDescription.includes('Label')
                        ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                        : preview.profile.outletType === 'Blog' || preview.profile.outletType === 'Magazine'
                        ? 'bg-[#00f044]/20 text-[#00f044]'
                        : 'bg-[#50a8ff]/20 text-[#50a8ff]'
                    }`}>
                      {preview.profile.angleDescription}
                    </span>
                  </div>

                  {/* Email Preview Box */}
                  <div className="bg-[#141519] border border-[#383b48] rounded p-3 space-y-2 text-xs">
                    <div className="space-y-0.5 text-[#8e93a2] font-mono border-b border-[#292c36] pb-2 text-[10.5px]">
                      <p className="truncate"><strong className="text-[#a6abb8]">TO:</strong> <span className="text-white">{preview.target.name} &lt;{preview.target.email}&gt;</span></p>
                      <p className="truncate"><strong className="text-[#a6abb8]">FROM:</strong> <span className="text-[#00f044] font-bold">{currentSenderName} &lt;{currentSenderEmail}&gt;</span></p>
                      <p className="truncate"><strong className="text-[#a6abb8]">SUBJ:</strong> <span className="text-[#ffa020]">{preview.renderedSubject}</span></p>
                    </div>

                    <div className="text-[#d6d9e0] whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto pr-1 font-sans text-xs">
                      {preview.renderedBody}
                    </div>
                  </div>
                </div>

                {/* Verified Campaign Links Box */}
                <div className="bg-[#1c1e24] border border-[#383b46] rounded p-3 text-[11px] font-mono space-y-1.5">
                  <span className="font-bold text-[#ffa020] uppercase block">⚡️ VERIFIED CAMPAIGN ASSET LINKS:</span>
                  <div className="flex flex-col space-y-1 text-[#a6abb8]">
                    <a href={settings?.wavDownloadUrl || 'https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav'} target="_blank" rel="noreferrer" className="text-[#ff761a] hover:underline truncate">
                      • WAV Master Download ("Seagull")
                    </a>
                    <a href={settings?.epkUrl || 'https://love-banana-epk.vercel.app/epk.html'} target="_blank" rel="noreferrer" className="text-[#ff761a] hover:underline truncate">
                      • Band EPK & Videos (love-banana-epk.vercel.app)
                    </a>
                    <a href={settings?.albumUrl || 'https://love-banana-epk.vercel.app/album.html'} target="_blank" rel="noreferrer" className="text-[#ff761a] hover:underline truncate">
                      • Album Stream & WAV Downloads (/album.html)
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: REPLIES INBOX (ABLETON MONITOR & RETURN CHANNEL)   */}
        {/* ========================================================= */}
        {activeTab === 'replies' && (
          <div className="space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2e3138] border border-[#434754] p-4 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-[#00f044] shadow-[0_0_6px_#00f044] inline-block" />
                <div>
                  <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                    DEVICE: INBOX MONITOR & DJ RESPONSES
                  </h2>
                  <p className="text-[11px] text-[#9ca0ae] mt-0.5">
                    Incoming feedback, spins, and interview requests from radio DJs and music editors
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={handleSimulateReply}
                  className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#383c46] hover:bg-[#434754] text-[#ffd000] border border-[#4e5362] transition flex items-center space-x-1.5 uppercase"
                  title="Simulate an inbound DJ response to test the inbox"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SIMULATE TEST REPLY</span>
                </button>

                <button
                  onClick={handleCheckReplies}
                  disabled={isCheckingReplies}
                  className="px-4 py-1.5 rounded text-xs font-mono font-black bg-[#00f044] hover:bg-[#14f854] text-[#121316] shadow-sm transition flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingReplies ? 'animate-spin' : ''}`} />
                  <span>{isCheckingReplies ? 'SYNCING GMAIL...' : 'SYNC GMAIL NOW'}</span>
                </button>
              </div>
            </div>

            {replies.length === 0 ? (
              <div className="bg-[#2e3138] border border-[#434754] rounded-md p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded bg-[#1c1e24] border border-[#383b46] flex items-center justify-center mx-auto text-[#00f044]">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">NO REPLIES IN QUEUE</p>
                <p className="text-xs text-[#9ca0ae] max-w-md mx-auto">
                  When a radio station or blog replies to Henry's pitch, it will automatically stream here with full thread history.
                </p>
                <button
                  onClick={handleSimulateReply}
                  className="px-4 py-2 rounded text-xs font-mono font-black bg-[#ff761a] text-[#121316] hover:bg-[#ff8630] transition inline-flex items-center space-x-1.5 uppercase"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TEST SIMULATE DJ RESPONSE</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left: Replies List */}
                <div className="lg:col-span-5 bg-[#2e3138] border border-[#434754] rounded-md overflow-hidden shadow-sm divide-y divide-[#383c48]">
                  {replies.map((reply) => {
                    const isSelected = selectedReply?.id === reply.id;
                    return (
                      <div
                        key={reply.id}
                        onClick={() => {
                          setSelectedReply(reply);
                          if (!reply.is_read) {
                            fetch(`/api/replies/${reply.id}`, { method: 'PATCH' });
                            setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, is_read: true } : r));
                          }
                        }}
                        className={`p-3.5 cursor-pointer transition flex items-start space-x-3 ${
                          isSelected ? 'bg-[#353843] border-l-4 border-l-[#00f044]' : 'hover:bg-[#32353f]'
                        }`}
                      >
                        <div className="shrink-0 mt-1">
                          {!reply.is_read ? (
                            <span className="w-2 h-2 rounded-full bg-[#00f044] shadow-[0_0_6px_#00f044] block animate-pulse" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#525666] block" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate font-mono">
                              {reply.from_name || reply.from_email}
                            </span>
                            <span className="text-[10px] text-[#8e93a2] font-mono">
                              {new Date(reply.received_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {reply.contact?.outlet && (
                            <div className="text-[11px] font-bold text-[#00f044] font-mono">
                              {reply.contact.outlet} ({reply.contact.category})
                            </div>
                          )}

                          <p className="text-xs text-[#d6d9e0] font-medium truncate">
                            {reply.subject}
                          </p>

                          <p className="text-[11px] text-[#8e93a2] line-clamp-2">
                            {reply.snippet}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Message Reader */}
                <div className="lg:col-span-7 bg-[#2e3138] border border-[#434754] rounded-md p-5 shadow-sm space-y-4">
                  {selectedReply ? (
                    <>
                      <div className="border-b border-[#3e424f] pb-3 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-bold text-white font-mono">{selectedReply.subject}</h3>
                          {selectedReply.contact?.outlet && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00f044]/15 text-[#00f044] border border-[#00f044]/30">
                              {selectedReply.contact.outlet}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#9ca0ae] font-mono">
                          FROM: <strong className="text-white">{selectedReply.from_name}</strong> &lt;{selectedReply.from_email}&gt;
                        </div>
                      </div>

                      <div className="bg-[#141519] border border-[#383b48] rounded p-4 text-[#d6d9e0] text-xs leading-relaxed whitespace-pre-wrap font-sans min-h-[220px]">
                        {selectedReply.body || selectedReply.snippet}
                      </div>

                      <div className="pt-2 flex items-center justify-between font-mono">
                        <span className="text-[11px] text-[#8e93a2]">
                          RECEIVED: {new Date(selectedReply.received_at).toLocaleString()}
                        </span>
                        <a
                          href={`mailto:${selectedReply.from_email}?subject=Re: ${encodeURIComponent(selectedReply.subject.replace(/^Re:\s*/i, ''))}`}
                          className="px-4 py-2 rounded text-xs font-mono font-black bg-[#ff761a] hover:bg-[#ff8630] text-[#121316] transition flex items-center space-x-1.5 uppercase"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>REPLY VIA GMAIL CLIENT</span>
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="py-20 text-center text-xs text-[#8e93a2] font-mono uppercase">
                      SELECT A TRANSMISSION ON THE LEFT TO MONITOR.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CONTACTS & CSV IMPORT (ABLETON SAMPLE/FILE BROWSER) */}
        {/* ========================================================= */}
        {activeTab === 'contacts' && (
          <div className="space-y-5">
            
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2e3138] border border-[#434754] p-4 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-[#50a8ff] shadow-[0_0_6px_#50a8ff] inline-block" />
                <div>
                  <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                    DATABASE: CONTACT DIRECTORY & IMPORT ({contacts.length} VERIFIED)
                  </h2>
                  <p className="text-[11px] text-[#9ca0ae] mt-0.5">
                    Preloaded Australian community radio, NZ bNet, US/Canada college stations, and global garage webzines
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-[#383c46] hover:bg-[#434754] text-[#d6d9e0] border border-[#4e5362] transition flex items-center space-x-1.5 uppercase"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD SINGLE LEAD</span>
                </button>
              </div>
            </div>

            {/* Manual Add Contact Drawer */}
            {showAddContact && (
              <form onSubmit={handleAddContactSubmit} className="bg-[#2e3138] border border-[#434754] rounded-md p-4 space-y-3 font-mono text-xs">
                <h3 className="text-xs font-bold text-[#ff761a] uppercase tracking-wider">
                  + INSERT NEW BROADCASTER / TASTEMAKER
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Direct Email *"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  />
                  <input
                    type="text"
                    placeholder="Outlet / Station / Blog"
                    value={newContact.outlet}
                    onChange={(e) => setNewContact({ ...newContact, outlet: e.target.value })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  />
                  <select
                    value={newContact.category}
                    onChange={(e) => setNewContact({ ...newContact, category: e.target.value as any })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  >
                    <option value="Radio">📻 Radio Broadcaster</option>
                    <option value="Blog">📝 Music Blog / Zine</option>
                    <option value="Magazine">📰 Magazine / Press</option>
                    <option value="Curator">🎧 Curator / DJ</option>
                    <option value="Other">🎵 Music Media</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <input
                    type="text"
                    placeholder="City (e.g. Sydney, Melbourne, Seattle...)"
                    value={newContact.city}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  />
                  <input
                    type="text"
                    placeholder="Country (e.g. Australia, USA, UK...)"
                    value={newContact.country}
                    onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                    className="bg-[#18191f] border border-[#3b3e4a] rounded p-2 text-white focus:outline-none focus:border-[#ff761a]"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="text-xs text-[#9ca0ae] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded text-xs font-black bg-[#ff761a] text-[#121316] hover:bg-[#ff8630] transition uppercase"
                  >
                    SAVE ENTRY
                  </button>
                </div>
              </form>
            )}

            {/* Ableton Sample / CSV Drop Box */}
            <div className="bg-[#2e3138] border border-[#434754] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-[#ff761a]" />
                    <span>IMPORT SPREADSHEET OR RAW CSV</span>
                  </h3>
                  <p className="text-[11px] text-[#9ca0ae]">
                    Upload a CSV file or paste contact lines below to append to your database
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-[#383c46] hover:bg-[#434754] text-white border border-[#4e5362] transition flex items-center space-x-1.5 uppercase"
                >
                  <Upload className="w-3.5 h-3.5 text-[#50a8ff]" />
                  <span>UPLOAD .CSV FILE</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) handleImportSubmit(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>

              <textarea
                rows={2}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Or paste CSV rows here... e.g.:&#10;2SER,music@2ser.com,2SER 107.3FM,Sydney,Australia&#10;Steve Lamacq,6music.newmusic@bbc.co.uk,BBC 6 Music,London,UK"
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff761a]"
              />

              {csvText.trim() && (
                <button
                  onClick={() => handleImportSubmit(csvText)}
                  disabled={isImporting}
                  className="px-4 py-1.5 rounded text-xs font-mono font-black bg-[#ff761a] text-[#121316] hover:bg-[#ff8630] transition uppercase"
                >
                  {isImporting ? 'IMPORTING...' : 'PARSE & APPEND CONTACTS'}
                </button>
              )}
            </div>

            {/* Contacts Table */}
            <div className="bg-[#2e3138] border border-[#434754] rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#d6d9e0]">
                  <thead className="bg-[#383c46] text-[#a6abb8] uppercase text-[10px] tracking-wider border-b border-[#434754] font-mono">
                    <tr>
                      <th className="p-3">NAME</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">OUTLET</th>
                      <th className="p-3">CATEGORY</th>
                      <th className="p-3">LOCATION</th>
                      <th className="p-3">CITY / COUNTRY</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#383c48]">
                    {contacts.map((c) => {
                      const badge = getLocationBadge(c);
                      const prof = getContactProfile(c);
                      return (
                        <tr key={c.id} className="hover:bg-[#343844] transition font-medium">
                          <td className="p-3 font-bold text-white">{c.name}</td>
                          <td className="p-3 text-[#ffa020] font-mono text-[11px]">{c.email}</td>
                          <td className="p-3 font-semibold text-[#e1e4ed]">{c.outlet || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border border-[#ffd000]/40 bg-[#ffd000]/15 text-[#ffd000]">
                              {prof.outletBadge.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border border-[#434754] bg-[#1a1c22] text-[#c6cad5]">
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 text-[#8e93a2] font-mono text-[11px]">{[c.city, c.country].filter(Boolean).join(', ') || 'Global'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1 rounded text-[#757a8a] hover:text-[#ff5555] hover:bg-[#ff5555]/10 transition"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GLOBAL DISCOVERY & DEEP SCRAPER ENGINE            */}
        {/* ========================================================= */}
        {activeTab === 'discovery' && (
          <DiscoveryView />
        )}

        {/* ========================================================= */}
        {/* TAB 5: OVERSEAS PHYSICAL LABEL DISTRO                    */}
        {/* ========================================================= */}
        {activeTab === 'labels' && (
          <LabelDistroView
            senderEmail={currentSenderEmail}
            senderName={currentSenderName}
            masterTemplate={labelTemplate}
            onNavigateToTemplates={() => setActiveTab('templates')}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 6: MASTER EMAIL TEMPLATES & MULTI-CHANNEL TONE STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'templates' && (
          <MasterTemplatesView
            radioTemplate={radioTemplate}
            blogTemplate={blogTemplate}
            labelTemplate={labelTemplate}
            contacts={contacts}
            settings={settings ? {
              ...settings,
              activeGmailAccount,
              secondaryGmailUser: secondaryGmailUser || settings.secondaryGmailUser,
              secondaryGmailAppPassword: secondaryGmailAppPassword || settings.secondaryGmailAppPassword,
              secondaryContactName: secondaryContactName || settings.secondaryContactName
            } : null}
            onSaveMasterTemplate={handleSaveMasterTemplate}
            defaultTemplates={{
              radio: DEFAULT_RADIO_TEMPLATE,
              blog: DEFAULT_BLOG_TEMPLATE,
              label: DEFAULT_LABEL_TEMPLATE
            }}
          />
        )}

      </main>

      {/* Dual Account Manager Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#2c2e35] border border-[#444755] rounded-md max-w-xl w-full p-5 space-y-4 shadow-2xl my-8 font-mono">
            <div className="flex items-center justify-between border-b border-[#3e424f] pb-3">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#ff761a]" />
                  <span>LINKED GMAIL ACCOUNTS (DUAL SENDER HARDWARE)</span>
                </h3>
                <p className="text-[11px] text-[#9ca0ae] mt-0.5 font-sans">
                  Easily switch between your primary band email and a separate safe outreach account.
                </p>
              </div>
              <button onClick={() => setShowGmailModal(false)} className="text-[#9ca0ae] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick selector at the top of the modal */}
            <div className="bg-[#141519] p-3 rounded border border-[#383b48] space-y-2">
              <span className="text-[9.5px] font-bold text-[#8e93a2] uppercase tracking-wider block">
                SELECT ACTIVE OUTGOING CHANNEL:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGmailAccount('primary')}
                  className={`p-2.5 rounded border text-left transition flex items-center justify-between ${
                    activeGmailAccount === 'primary'
                      ? 'bg-[#353843] border-[#ff761a] text-white ring-1 ring-[#ff761a]'
                      : 'bg-[#1c1e24] border-[#383b46] text-[#8e93a2] hover:text-white'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-xs block">🍌 CH 1: MAIN BAND</span>
                    <span className="text-[10px] text-[#8e93a2] font-mono truncate block">
                      {gmailUser || 'lovebananaband@gmail.com'}
                    </span>
                  </div>
                  {activeGmailAccount === 'primary' && <span className="w-2 h-2 rounded-full bg-[#ff761a] shadow-[0_0_5px_#ff761a] ml-1 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGmailAccount('secondary')}
                  className={`p-2.5 rounded border text-left transition flex items-center justify-between ${
                    activeGmailAccount === 'secondary'
                      ? 'bg-[#353843] border-[#00f044] text-white ring-1 ring-[#00f044]'
                      : 'bg-[#1c1e24] border-[#383b46] text-[#8e93a2] hover:text-white'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-xs block">⚡ CH 2: HENRY (OUTREACH)</span>
                    <span className="text-[10px] text-[#8e93a2] font-mono truncate block">
                      {secondaryGmailUser || '+ Link Outreach Gmail'}
                    </span>
                  </div>
                  {activeGmailAccount === 'secondary' && <span className="w-2 h-2 rounded-full bg-[#00f044] shadow-[0_0_5px_#00f044] ml-1 shrink-0" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveGmail} className="space-y-3.5 text-xs">
              
              {/* Account 1 Card */}
              <div className={`p-3.5 rounded border space-y-2.5 transition ${
                activeGmailAccount === 'primary'
                  ? 'bg-[#2e3138] border-[#ff761a]/60 ring-1 ring-[#ff761a]/40'
                  : 'bg-[#22242b] border-[#383b46] opacity-80 hover:opacity-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">🍌 CH 1: Main Band Account (Love Banana)</span>
                    {activeGmailAccount === 'primary' && (
                      <span className="text-[9px] uppercase font-bold bg-[#ff761a]/20 text-[#ff761a] border border-[#ff761a]/40 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  {isPrimaryConnected ? (
                    <span className="text-[10px] font-semibold text-[#00f044] flex items-center gap-1">
                      ● CONNECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#757a8a]">OFFLINE</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8e93a2] mb-1">GMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. lovebananaband@gmail.com"
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                      className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#ff761a] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8e93a2] mb-1">16-LETTER APP PASSWORD</label>
                    <input
                      type="password"
                      placeholder="e.g. abcd efgh ijkl mnop"
                      value={gmailAppPassword}
                      onChange={(e) => setGmailAppPassword(e.target.value)}
                      className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#ff761a] font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <label className="text-[#8e93a2] mr-2">SENDER NAME:</label>
                    <input
                      type="text"
                      placeholder="Henry Collins"
                      value={primaryContactName}
                      onChange={(e) => setPrimaryContactName(e.target.value)}
                      className="bg-[#18191f] border border-[#3b3e4a] rounded px-2 py-0.5 text-white focus:outline-none focus:border-[#ff761a] text-xs"
                    />
                  </div>
                  {activeGmailAccount !== 'primary' && (
                    <button
                      type="button"
                      onClick={() => setActiveGmailAccount('primary')}
                      className="text-[#ff761a] hover:underline text-[10px] font-bold uppercase"
                    >
                      SWITCH TO CH 1
                    </button>
                  )}
                </div>
              </div>

              {/* Account 2 Card (Safe / Burner / Alternative Sender) */}
              <div className={`p-3.5 rounded border space-y-2.5 transition ${
                activeGmailAccount === 'secondary'
                  ? 'bg-[#2e3138] border-[#00f044]/60 ring-1 ring-[#00f044]/40'
                  : 'bg-[#22242b] border-[#383b46] opacity-80 hover:opacity-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">⚡ CH 2: Henry (Secondary Outreach Email)</span>
                    {activeGmailAccount === 'secondary' && (
                      <span className="text-[9px] uppercase font-bold bg-[#00f044]/20 text-[#00f044] border border-[#00f044]/40 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  {isSecondaryConnected ? (
                    <span className="text-[10px] font-semibold text-[#00f044] flex items-center gap-1">
                      ● READY (REPLIES ROUTED TO YOUR OUTREACH INBOX)
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#757a8a]">ENTER EMAIL TO ACTIVATE</span>
                  )}
                </div>

                <div className="p-2 rounded bg-[#18191f] border border-[#383b48] text-[10.5px] text-[#8e93a2] flex items-start gap-1.5 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00f044] shrink-0 mt-0.5" />
                  <span>
                    <strong>Cold Outreach & Reply-To Routing:</strong> Only pitches sent from Messenger Pigeon on Steroids route here. Your normal phone and Gmail apps are <strong>100% unaffected</strong>. When DJs or station directors click "Reply", their response goes straight to your new inbox.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8e93a2] mb-1 font-bold">
                      OUTREACH / REPLY-TO EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. your-new-email@gmail.com"
                      value={secondaryGmailUser}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecondaryGmailUser(val);
                        saveStoredSettings({ secondaryGmailUser: val, activeGmailAccount: 'secondary' });
                      }}
                      className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#00f044] text-xs font-mono"
                    />
                    <span className="text-[9px] text-[#757a8a] block mt-0.5">
                      Where radio & blog replies will land.
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8e93a2] mb-1 font-bold">
                      16-LETTER APP PASSWORD (GOOGLE)
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. abcd efgh ijkl mnop"
                      value={secondaryGmailAppPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecondaryGmailAppPassword(val);
                        saveStoredSettings({ secondaryGmailAppPassword: val });
                      }}
                      className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#00f044] font-mono text-xs"
                    />
                    <span className="text-[9px] text-[#757a8a] block mt-0.5">
                      Permanent direct IMAP & draft access for Channel 2.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <label className="text-[#8e93a2] mr-2">SENDER DISPLAY NAME:</label>
                    <input
                      type="text"
                      placeholder="Henry Collins"
                      value={secondaryContactName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecondaryContactName(val);
                        saveStoredSettings({ secondaryContactName: val });
                      }}
                      className="bg-[#18191f] border border-[#3b3e4a] rounded px-2 py-0.5 text-white focus:outline-none focus:border-[#00f044] text-xs"
                    />
                  </div>
                  {activeGmailAccount !== 'secondary' && (
                    <button
                      type="button"
                      onClick={() => setActiveGmailAccount('secondary')}
                      className="text-[#00f044] hover:underline text-[10px] font-bold uppercase"
                    >
                      SWITCH TO CH 2
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions Guide Card */}
              <div className="bg-[#141519] border border-[#383b48] rounded p-3 text-[10.5px] text-[#8e93a2] space-y-1 font-sans">
                <span className="font-bold text-white block font-mono text-[10px]">⚡️ HOW TO GENERATE A 16-LETTER APP PASSWORD:</span>
                <p>
                  1. Navigate to{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#ff761a] underline font-semibold inline-flex items-center gap-0.5"
                  >
                    <span>myaccount.google.com/apppasswords</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  while logged into that account.
                </p>
                <p>2. Enter &quot;Messenger Pigeon on Steroids&quot; as the App Name, click Create, and paste the 16 characters above.</p>
              </div>

              {/* Permanent Persistence Confirmation Box */}
              <div className="bg-[#131f18] border border-[#00f044]/40 rounded p-3 text-[10.5px] space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-[#00f044] font-mono font-bold text-[10.5px]">
                  <ShieldCheck className="w-4 h-4 text-[#00f044]" />
                  <span>PERMANENT MULTI-LAYER HARDWARE PERSISTENCE ACTIVE</span>
                </div>
                <p className="text-[#a0c8a8]">
                  Your credentials and selected channel are permanently synchronized across LocalStorage, SessionStorage, and a 1-year HTTP Cookie. Refreshing the page, closing your browser, or serverless cold restarts will <strong>never</strong> disconnect Channel 2.
                </p>
              </div>


              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#3e424f]">
                <button
                  type="button"
                  onClick={() => setShowGmailModal(false)}
                  className="px-3.5 py-1.5 text-xs font-mono font-bold text-[#9ca0ae] hover:text-white uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingGmail}
                  className="px-5 py-2 rounded text-xs font-mono font-black bg-[#ff761a] hover:bg-[#ff8630] text-[#121316] shadow-sm border border-[#ff8d3b] transition flex items-center space-x-1.5 uppercase"
                >
                  <span>{savingGmail ? 'SAVING HARDWARE...' : 'SAVE & SET ACTIVE CHANNEL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
