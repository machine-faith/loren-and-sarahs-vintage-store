'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Radio, 
  Disc, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  Users, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  Tag 
} from 'lucide-react';
import { Contact, Settings } from '@/lib/db';
import { INITIAL_LABEL_TARGETS, buildLabelPitch } from '@/lib/label-targets';
import { renderPitchClient } from '@/lib/contact-profile';

export type TemplateChannel = 'radio' | 'blog' | 'label';

export interface ChannelTemplateData {
  subject: string;
  body: string;
}

interface MasterTemplatesViewProps {
  radioTemplate: ChannelTemplateData;
  blogTemplate: ChannelTemplateData;
  labelTemplate: ChannelTemplateData;
  contacts: Contact[];
  settings: Settings | null;
  onSaveMasterTemplate: (channel: TemplateChannel, template: ChannelTemplateData) => Promise<void>;
  defaultTemplates: {
    radio: ChannelTemplateData;
    blog: ChannelTemplateData;
    label: ChannelTemplateData;
  };
}

export default function MasterTemplatesView({
  radioTemplate,
  blogTemplate,
  labelTemplate,
  contacts,
  settings,
  onSaveMasterTemplate,
  defaultTemplates
}: MasterTemplatesViewProps) {
  const [activeChannel, setActiveChannel] = useState<TemplateChannel>('radio');

  // Local draft states for each channel
  const [draftTemplates, setDraftTemplates] = useState<Record<TemplateChannel, ChannelTemplateData>>({
    radio: { ...radioTemplate },
    blog: { ...blogTemplate },
    label: { ...labelTemplate }
  });

  // Keep local draft in sync if parent props change
  useEffect(() => {
    setDraftTemplates({
      radio: { ...radioTemplate },
      blog: { ...blogTemplate },
      label: { ...labelTemplate }
    });
  }, [radioTemplate, blogTemplate, labelTemplate]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTemplate = draftTemplates[activeChannel];

  const handleSubjectChange = (val: string) => {
    setDraftTemplates(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        subject: val
      }
    }));
  };

  const handleBodyChange = (val: string) => {
    setDraftTemplates(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        body: val
      }
    }));
  };

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleBodyChange(currentTemplate.body + ' ' + token);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldText = currentTemplate.body;
    const newText = oldText.substring(0, start) + token + oldText.substring(end);
    handleBodyChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const handleResetToDefault = () => {
    const def = defaultTemplates[activeChannel];
    if (confirm(`Reset the ${activeChannel.toUpperCase()} template back to factory default?`)) {
      setDraftTemplates(prev => ({
        ...prev,
        [activeChannel]: { ...def }
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      await onSaveMasterTemplate(activeChannel, currentTemplate);
      setSaveSuccessMsg(`Master ${activeChannel.toUpperCase()} template saved! All active drafts & future emails updated.`);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Contacts counts per channel
  const radioContacts = contacts.filter(c => c.category === 'Radio' || !c.category);
  const blogContacts = contacts.filter(c => c.category === 'Blog' || c.category === 'Magazine' || c.category === 'Curator');
  const labelTargetsCount = INITIAL_LABEL_TARGETS.length;

  // Personalization tokens by channel
  const commonTokens = [
    { tag: '{{first_name}}', desc: "Recipient's first name (e.g. Marc)" },
    { tag: '{{from_email}}', desc: "Active sender email (e.g. outreach or main band email)" },
    { tag: '{{contact_name}}', desc: "Sender display name (Henry Collins)" },
    { tag: '{{greeting}}', desc: "Opening greeting (e.g. 'Hey Marc,')" },
    { tag: '{{signoff_line}}', desc: "Warm sign-off line" },
    { tag: '{{outlet}}', desc: "Station or publication or label name (e.g. 2SER, Clash)" },
    { tag: '{{city}}', desc: "City (e.g. Sydney, London)" },
    { tag: '{{country}}', desc: "Country (e.g. Australia, UK)" },
    { tag: '{{wav_url}}', desc: 'Direct WAV master download URL' },
    { tag: '{{album_url}}', desc: 'Album promo / downloads page' },
    { tag: '{{epk_url}}', desc: 'Love Banana live EPK link' },
    { tag: '{{bandcamp_url}}', desc: 'Bandcamp page link' },
    { tag: '{{instagram_url}}', desc: 'Instagram link' }
  ];

  const channelSpecificTokens: Record<TemplateChannel, Array<{ tag: string; desc: string }>> = {
    radio: [
      { tag: '{{subject_variant}}', desc: 'Smart human subject line variant' },
      { tag: '{{location_phrase}}', desc: '"based here in Sydney" / "based in Sydney"' },
      { tag: '{{story_hook}}', desc: 'Single & album release backstory (mastered by Mikey Young)' },
      { tag: '{{ask_phrase}}', desc: 'Contextual airplay or phone interview request' }
    ],
    blog: [
      { tag: '{{subject_variant}}', desc: 'Smart human review/feature subject line' },
      { tag: '{{ask_phrase}}', desc: 'Track write-up / premiere review ask' }
    ],
    label: [
      { tag: '{{salutation}}', desc: 'Personal greeting (e.g. "Hey Gabriele,")' },
      { tag: '{{label_name}}', desc: 'Target label name (e.g. "Goodbye Boozy Records")' },
      { tag: '{{connection_line}}', desc: 'Michael Barker / Gee Tee / Ragnar connection' },
      { tag: '{{territory}}', desc: 'Target territory (e.g. "Europe", "USA")' },
      { tag: '{{location}}', desc: 'Label location (e.g. "San Salvo, Italy")' }
    ]
  };

  // Render preview for current active channel
  const renderChannelPreview = () => {
    if (activeChannel === 'label') {
      const sampleLabel = INITIAL_LABEL_TARGETS[0]; // Gabriele / Goodbye Boozy
      const rendered = buildLabelPitch(sampleLabel, currentTemplate);
      return {
        recipientName: sampleLabel.name,
        recipientEmail: sampleLabel.email,
        outletName: sampleLabel.labelName,
        subject: rendered.subject,
        body: rendered.body,
        badge: '💿 Record Label Partner',
        badgeColor: 'text-[#00d4ff] bg-[#00d4ff]/15 border-[#00d4ff]/30'
      };
    } else if (activeChannel === 'blog') {
      const sampleBlog = blogContacts[0] || {
        id: 'sample-blog',
        name: 'Robin Murray',
        email: 'robin@clashmusic.com',
        outlet: 'Clash Magazine',
        category: 'Blog' as const,
        city: 'London',
        country: 'United Kingdom',
        genre_fit: 'Garage Pop / Indie Rock',
        notes: '',
        stage: 'lead' as const,
        last_contacted_at: null,
        created_at: ''
      };
      const rendered = renderPitchClient({
        templateSubject: currentTemplate.subject,
        templateBody: currentTemplate.body,
        contact: sampleBlog,
        settings
      });
      return {
        recipientName: sampleBlog.name,
        recipientEmail: sampleBlog.email,
        outletName: sampleBlog.outlet,
        subject: rendered.subject,
        body: rendered.body,
        badge: '📝 Music Blog & Press',
        badgeColor: 'text-[#00f044] bg-[#00f044]/15 border-[#00f044]/30'
      };
    } else {
      const sampleRadio = radioContacts[0] || {
        id: 'sample-radio',
        name: 'FBi Radio Music Team',
        email: 'music@fbiradio.com',
        outlet: 'FBi Radio 94.5FM',
        category: 'Radio' as const,
        city: 'Sydney',
        country: 'Australia',
        genre_fit: 'Garage Pop / Indie Rock',
        notes: '',
        stage: 'lead' as const,
        last_contacted_at: null,
        created_at: ''
      };
      const rendered = renderPitchClient({
        templateSubject: currentTemplate.subject,
        templateBody: currentTemplate.body,
        contact: sampleRadio,
        settings
      });
      return {
        recipientName: sampleRadio.name,
        recipientEmail: sampleRadio.email,
        outletName: sampleRadio.outlet,
        subject: rendered.subject,
        body: rendered.body,
        badge: '📻 Community & College Radio',
        badgeColor: 'text-[#ff761a] bg-[#ff761a]/15 border-[#ff761a]/30'
      };
    }
  };

  const previewData = renderChannelPreview();

  const channelBg = 
    activeChannel === 'radio' ? 'bg-[#ff761a]' :
    activeChannel === 'blog' ? 'bg-[#00f044]' : 'bg-[#00d4ff]';

  return (
    <div className="space-y-5">

      {/* Top Header Rack */}
      <div className="bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden">
        <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd000] shadow-[0_0_6px_#ffd000] inline-block shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ffd000]" />
              <span>MASTER EMAIL TEMPLATES & TONE STUDIO</span>
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-[#1a1c22] text-[#ffd000] px-2 py-0.5 rounded border border-[#3e424f] shrink-0">
              3 CHANNELS
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10.5px] font-mono text-[#a6abb8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f044]" />
            <span>Editing any master template dynamically synchronizes all subsequent & drafted emails</span>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <div className="bg-[#00f044]/15 border-b border-[#00f044]/30 px-4 py-2.5 text-xs text-[#00f044] font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="underline hover:text-white font-bold ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Channel Selector Device Rack */}
        <div className="p-3 bg-[#24262c] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          
          {/* Channel 1: Radio Station */}
          <button
            type="button"
            onClick={() => setActiveChannel('radio')}
            className={`p-3 rounded border text-left transition space-y-1.5 ${
              activeChannel === 'radio'
                ? 'bg-[#353843] border-[#ff761a] ring-1 ring-[#ff761a] shadow-sm'
                : 'bg-[#2b2d35] border-[#3e424f] hover:bg-[#32353f]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#ff761a]" />
                <span>📻 RADIO STATION CHANNEL</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#1a1c22] px-1.5 py-0.5 rounded text-[#ff761a] border border-[#ff761a]/30">
                {radioContacts.length} CONTACTS
              </span>
            </div>
            <p className="text-[11px] text-[#9ca0ae] line-clamp-2 font-sans">
              Master text for Australian community radio, US/Canada college, and European indie stations. Emphasizes spins & WAV master downloads.
            </p>
          </button>

          {/* Channel 2: Blog & Press */}
          <button
            type="button"
            onClick={() => setActiveChannel('blog')}
            className={`p-3 rounded border text-left transition space-y-1.5 ${
              activeChannel === 'blog'
                ? 'bg-[#353843] border-[#00f044] ring-1 ring-[#00f044] shadow-sm'
                : 'bg-[#2b2d35] border-[#3e424f] hover:bg-[#32353f]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#00f044]" />
                <span>📝 BLOG & PRESS CHANNEL</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#1a1c22] px-1.5 py-0.5 rounded text-[#00f044] border border-[#00f044]/30">
                {blogContacts.length} CONTACTS
              </span>
            </div>
            <p className="text-[11px] text-[#9ca0ae] line-clamp-2 font-sans">
              Master text for music webzines, blogs, and review writers. Emphasizes track write-ups, premieres, and advance streams.
            </p>
          </button>

          {/* Channel 3: Record Label Distro */}
          <button
            type="button"
            onClick={() => setActiveChannel('label')}
            className={`p-3 rounded border text-left transition space-y-1.5 ${
              activeChannel === 'label'
                ? 'bg-[#353843] border-[#00d4ff] ring-1 ring-[#00d4ff] shadow-sm'
                : 'bg-[#2b2d35] border-[#3e424f] hover:bg-[#32353f]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>💿 RECORD LABEL CHANNEL</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#1a1c22] px-1.5 py-0.5 rounded text-[#00d4ff] border border-[#00d4ff]/30">
                {labelTargetsCount} LABELS
              </span>
            </div>
            <p className="text-[11px] text-[#9ca0ae] line-clamp-2 font-sans">
              Master text for overseas indie labels and vinyl/cassette partners. Mentions Ragnar Records / Michael Barker (Gee Tee) and tour plans.
            </p>
          </button>

        </div>
      </div>

      {/* Main Two-Column Studio: Composer on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left: Master Tone Editor (7 cols) */}
        <div className="lg:col-span-7 bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden space-y-0">
          <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${channelBg} inline-block`} />
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                EDIT MASTER: {activeChannel.toUpperCase()} TEMPLATE
              </h3>
            </div>
            
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[10.5px] font-mono text-[#8e93a2] hover:text-white flex items-center space-x-1 transition uppercase"
              title="Reset this channel back to original template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET DEFAULT</span>
            </button>
          </div>

          <div className="p-4 bg-[#282a31] space-y-4">
            
            {/* Subject Line Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8]">
                  MASTER SUBJECT LINE
                </label>
                <span className="text-[10px] font-mono text-[#8e93a2]">
                  Supports tokens like <code className="text-[#ffa020]">&#123;&#123;subject_variant&#125;&#125;</code>
                </span>
              </div>
              <input
                type="text"
                value={currentTemplate.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-3 py-2 text-xs text-[#ffa020] font-mono focus:outline-none focus:border-[#ffd000]"
                placeholder="Enter email subject line..."
              />
            </div>

            {/* Email Body Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8]">
                  MASTER EMAIL BODY
                </label>
                <span className="text-[10.5px] font-mono text-[#8e93a2]">
                  Type your exact voice & tone below
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={16}
                value={currentTemplate.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded p-3 text-xs text-[#d6d9e0] focus:outline-none focus:border-[#ffd000] leading-relaxed font-sans"
                placeholder="Write your email pitch here..."
              />
            </div>

            {/* Personalization Tokens Helper Chips */}
            <div className="bg-[#1c1e24] border border-[#383b46] rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffd000] flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>CLICK TO INSERT PERSONALIZATION VARIABLE:</span>
                </span>
                <span className="text-[9.5px] font-mono text-[#8e93a2]">
                  Inserts at cursor position
                </span>
              </div>

              {/* Channel-Specific Tags */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-mono text-[#a6abb8] uppercase block font-bold">
                  ★ Channel-Specific Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {channelSpecificTokens[activeChannel].map((tok) => (
                    <button
                      key={tok.tag}
                      type="button"
                      onClick={() => handleInsertToken(tok.tag)}
                      title={tok.desc}
                      className="px-2 py-1 rounded bg-[#2a2d36] hover:bg-[#343844] text-[#ffa020] font-mono text-[10.5px] border border-[#484c5a] transition flex items-center space-x-1"
                    >
                      <span className="font-bold">{tok.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Tags */}
              <div className="space-y-1.5 pt-1.5 border-t border-[#2e313b]">
                <span className="text-[9.5px] font-mono text-[#a6abb8] uppercase block font-bold">
                  Campaign & Contact Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonTokens.map((tok) => (
                    <button
                      key={tok.tag}
                      type="button"
                      onClick={() => handleInsertToken(tok.tag)}
                      title={tok.desc}
                      className="px-2 py-1 rounded bg-[#22242b] hover:bg-[#2c2f38] text-[#d6d9e0] font-mono text-[10px] border border-[#383b46] transition"
                    >
                      {tok.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Master Action Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#3b3e4a]">
              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#9ca0ae]">
                <ShieldCheck className="w-4 h-4 text-[#00f044] shrink-0" />
                <span>
                  Updates master record and propagates to all active drafts immediately.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full sm:w-auto px-6 py-2.5 rounded text-xs font-mono font-black ${channelBg} text-[#121316] shadow-sm transition flex items-center justify-center space-x-2 uppercase tracking-wide disabled:opacity-50`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#121316] border-t-transparent rounded-full animate-spin" />
                    <span>SAVING & PROPAGATING...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#121316]" />
                    <span>SAVE MASTER & UPDATE ALL {activeChannel.toUpperCase()} EMAILS</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right: Live Rendered Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden space-y-0 sticky top-20">
          <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00f044] shadow-[0_0_5px_#00f044] inline-block" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                LIVE RENDERED PREVIEW
              </h3>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${previewData.badgeColor}`}>
              {previewData.badge}
            </span>
          </div>

          <div className="p-3.5 bg-[#282a31] space-y-3">
            
            {/* Contact Info Header Panel */}
            <div className="bg-[#141519] border border-[#383b48] rounded px-3 py-2 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-[#8e93a2] text-[10.5px]">
                <span>SAMPLE OUTLET:</span>
                <span className="text-white font-bold">{previewData.outletName}</span>
              </div>
              <div className="flex items-center justify-between text-[#8e93a2] text-[10.5px]">
                <span>SAMPLE RECIPIENT:</span>
                <span className="text-[#00f044] font-semibold">{previewData.recipientName} &lt;{previewData.recipientEmail}&gt;</span>
              </div>
            </div>

            {/* Email Preview Frame */}
            <div className="bg-[#141519] border border-[#383b48] rounded p-3.5 space-y-2.5 text-xs">
              <div className="space-y-1 text-[#8e93a2] font-mono border-b border-[#292c36] pb-2 text-[10.5px]">
                <p className="truncate">
                  <strong className="text-[#a6abb8]">TO:</strong> <span className="text-white">{previewData.recipientName} &lt;{previewData.recipientEmail}&gt;</span>
                </p>
                <p className="truncate">
                  <strong className="text-[#a6abb8]">FROM:</strong>{' '}
                  <span className="text-[#00f044] font-bold">
                    {activeChannel === 'label'
                      ? `${settings?.contactName || 'Henry Collins'} <${settings?.gmailUser || settings?.fromEmail || 'lovebananaband@gmail.com'}>`
                      : (settings?.activeGmailAccount === 'secondary'
                          ? `${settings?.secondaryContactName || 'Henry Collins'} <${settings?.secondaryGmailUser || 'Outreach Email (Channel 2)'}>`
                          : `${settings?.contactName || 'Henry Collins'} <${settings?.gmailUser || settings?.fromEmail || 'lovebananaband@gmail.com'}>`
                        )}
                  </span>
                </p>
                <p className="truncate">
                  <strong className="text-[#a6abb8]">SUBJ:</strong> <span className="text-[#ffa020] font-bold">{previewData.subject}</span>
                </p>
              </div>

              <div className="text-[#d6d9e0] whitespace-pre-wrap leading-relaxed max-h-[440px] overflow-y-auto pr-1 font-sans text-xs">
                {previewData.body}
              </div>
            </div>

            {/* Impact Notification */}
            <div className="bg-[#1c1e24] border border-[#383b46] rounded p-3 text-[11px] font-mono text-[#a6abb8] space-y-1">
              <span className="font-bold text-[#ffd000] uppercase block">
                ⚡️ WHAT HAPPENS WHEN YOU SAVE:
              </span>
              <p>
                • <strong>Database:</strong> The master template for <code>{activeChannel.toUpperCase()}</code> is permanently updated.
              </p>
              <p>
                • <strong>Active Drafts:</strong> All un-sent draft emails and presets in the CRM switch to your new text immediately.
              </p>
              <p>
                • <strong>Safety:</strong> No emails are sent automatically. You always retain 100% control to review before sending.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
