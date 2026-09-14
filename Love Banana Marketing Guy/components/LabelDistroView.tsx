'use client';

import React, { useState, useMemo } from 'react';
import { 
  Disc, 
  Mail, 
  Copy, 
  ExternalLink, 
  Check, 
  CheckCircle2, 
  Search, 
  Send,
  Globe,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  X
} from 'lucide-react';
import { LabelTarget, INITIAL_LABEL_TARGETS, buildLabelPitch } from '@/lib/label-targets';

interface LabelDistroViewProps {
  senderEmail?: string;
  senderName?: string;
  masterTemplate?: { subject: string; body: string };
  onNavigateToTemplates?: () => void;
}

export default function LabelDistroView({
  senderEmail = 'lovebananaband@gmail.com',
  senderName = 'Henry Collins',
  masterTemplate,
  onNavigateToTemplates
}: LabelDistroViewProps) {
  const [labels, setLabels] = useState<LabelTarget[]>(INITIAL_LABEL_TARGETS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_LABEL_TARGETS[0].id);
  const [mobileTab, setMobileTab] = useState<'roster' | 'inspector'>('roster');
  const [filterTerritory, setFilterTerritory] = useState<'ALL' | 'Europe' | 'USA' | 'New Zealand' | 'Japan' | 'South America' | 'Global'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>(INITIAL_LABEL_TARGETS.map(l => l.id));
  
  // Custom edited copy per label
  const [customDrafts, setCustomDrafts] = useState<Record<string, { subject: string; body: string }>>(() => {
    const initial: Record<string, { subject: string; body: string }> = {};
    INITIAL_LABEL_TARGETS.forEach(l => {
      initial[l.id] = buildLabelPitch(l, masterTemplate);
    });
    return initial;
  });

  // Re-sync all drafts when masterTemplate changes
  React.useEffect(() => {
    if (masterTemplate && (masterTemplate.body || masterTemplate.subject)) {
      setCustomDrafts(() => {
        const updated: Record<string, { subject: string; body: string }> = {};
        INITIAL_LABEL_TARGETS.forEach(l => {
          updated[l.id] = buildLabelPitch(l, masterTemplate);
        });
        return updated;
      });
    }
  }, [masterTemplate]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBatchDrafting, setIsBatchDrafting] = useState(false);
  const [singleDraftingId, setSingleDraftingId] = useState<string | null>(null);
  const [draftSuccessMessage, setDraftSuccessMessage] = useState<string | null>(null);

  const selectedTarget = useMemo(() => {
    return labels.find(l => l.id === selectedId) || labels[0];
  }, [labels, selectedId]);

  const currentPitch = customDrafts[selectedTarget.id] || buildLabelPitch(selectedTarget, masterTemplate);

  const filteredLabels = useMemo(() => {
    return labels.filter(l => {
      const matchesTerritory = filterTerritory === 'ALL' || l.territory === filterTerritory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        l.labelName.toLowerCase().includes(q) || 
        l.name.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q) ||
        l.connection.toLowerCase().includes(q);
      return matchesTerritory && matchesSearch;
    });
  }, [labels, filterTerritory, searchQuery]);

  const currentIndex = useMemo(() => {
    const idx = filteredLabels.findIndex(l => l.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [filteredLabels, selectedId]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredLabels.length - 1;

  const handlePrevLabel = () => {
    if (hasPrev) {
      setSelectedId(filteredLabels[currentIndex - 1].id);
    }
  };

  const handleNextLabel = () => {
    if (hasNext) {
      setSelectedId(filteredLabels[currentIndex + 1].id);
    }
  };

  // Handle manual edits to subject/body
  const handleBodyChange = (newBody: string) => {
    setCustomDrafts(prev => ({
      ...prev,
      [selectedTarget.id]: {
        ...prev[selectedTarget.id],
        body: newBody
      }
    }));
  };

  const handleSubjectChange = (newSubject: string) => {
    setCustomDrafts(prev => ({
      ...prev,
      [selectedTarget.id]: {
        ...prev[selectedTarget.id],
        subject: newSubject
      }
    }));
  };

  // Copy to clipboard
  const handleCopy = async (targetId: string) => {
    const t = labels.find(l => l.id === targetId) || selectedTarget;
    const pitch = customDrafts[targetId] || buildLabelPitch(t);
    const fullText = `Subject: ${pitch.subject}\n\n${pitch.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId(targetId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Push single label to Gmail Drafts
  const handlePushSingleDraft = async (targetId: string) => {
    const t = labels.find(l => l.id === targetId);
    if (!t) return;
    setSingleDraftingId(targetId);
    setDraftSuccessMessage(null);

    const pitch = customDrafts[targetId] || buildLabelPitch(t);

    try {
      const res = await fetch('/api/labels/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          targets: [{
            id: t.id,
            email: t.email,
            subject: pitch.subject,
            body: pitch.body
          }]
        })
      });
      const data = await res.json();

      if (data.success) {
        setLabels(prev => prev.map(l => l.id === targetId ? { ...l, status: 'drafted' } : l));
        setDraftSuccessMessage(`Draft for ${t.labelName} saved in Gmail Drafts folder!`);
        setTimeout(() => setDraftSuccessMessage(null), 6000);
      } else {
        alert(data.error || 'Failed to push draft to Gmail');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSingleDraftingId(null);
    }
  };

  // Push batch to Gmail Drafts
  const handlePushBatchDrafts = async () => {
    if (selectedForBatch.length === 0) return;
    setIsBatchDrafting(true);
    setDraftSuccessMessage(null);

    const payload = selectedForBatch.map(id => {
      const t = labels.find(l => l.id === id)!;
      const pitch = customDrafts[id] || buildLabelPitch(t);
      return {
        id: t.id,
        email: t.email,
        subject: pitch.subject,
        body: pitch.body
      };
    });

    try {
      const res = await fetch('/api/labels/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', targets: payload })
      });
      const data = await res.json();

      if (data.success) {
        setLabels(prev => prev.map(l => {
          if (selectedForBatch.includes(l.id)) {
            return { ...l, status: 'drafted' };
          }
          return l;
        }));
        setDraftSuccessMessage(`Successfully created ${selectedForBatch.length} drafts in your Gmail Drafts folder!`);
        setTimeout(() => setDraftSuccessMessage(null), 8000);
      } else {
        alert(data.error || 'Failed to push drafts');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsBatchDrafting(false);
    }
  };

  // Generate web compose URL
  const getGmailComposeUrl = (target: LabelTarget) => {
    const pitch = customDrafts[target.id] || buildLabelPitch(target);
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: target.email,
      su: pitch.subject,
      body: pitch.body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  };

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (selectedForBatch.length === filteredLabels.length) {
      setSelectedForBatch([]);
    } else {
      setSelectedForBatch(filteredLabels.map(l => l.id));
    }
  };

  const handleSelectCard = (targetId: string) => {
    setSelectedId(targetId);
    setMobileTab('inspector');
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Ableton Header Rack */}
      <div className="bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden">
        <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_6px_#00d4ff] inline-block shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5 truncate">
              <Disc className="w-4 h-4 text-[#00d4ff] shrink-0" />
              <span className="truncate">LABEL DISTRO ENGINE</span>
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-[#1a1c22] text-[#00d4ff] px-2 py-0.5 rounded border border-[#3e424f] shrink-0">
              {labels.length} TARGETS
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-mono text-[#a6abb8] overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[#00f044] whitespace-nowrap">● 5 GEE TEE ALUMNI (MICHAEL BARKER SUBJECT)</span>
            <span className="text-[#555968]">|</span>
            <span className="text-[#ffa020] whitespace-nowrap">● 23 LABELS (GARAGE POP SUBJECT)</span>
          </div>
        </div>

        {/* Safety Guidance Bar */}
        <div className="p-3 bg-[#1e2026] border-b border-[#3e424f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#d6d9e0]">
          <div className="flex items-start sm:items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#00f044] shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              <strong className="text-white">Safety Lock Active:</strong> Direct live blast sending is disabled. Push to your <strong className="text-[#00d4ff]">Gmail Drafts</strong> or open directly in <strong className="text-[#ffa020]">Gmail Compose</strong> to review and send manually.
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            {onNavigateToTemplates && (
              <button
                type="button"
                onClick={onNavigateToTemplates}
                className="px-3 py-1.5 rounded border border-[#434754] bg-[#2e3138] hover:bg-[#383c46] text-[#a6abb8] hover:text-white font-mono font-bold text-xs transition flex items-center space-x-1.5 uppercase"
                title="Edit the master label pitch template"
              >
                <span>EDIT MASTER TPL</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePushBatchDrafts}
              disabled={isBatchDrafting || selectedForBatch.length === 0}
              className="px-3.5 py-1.5 rounded bg-[#00d4ff] hover:bg-[#20dcff] disabled:opacity-50 text-[#121316] font-mono font-black text-xs transition flex items-center space-x-1.5 uppercase shadow-sm"
            >
              {isBatchDrafting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{isBatchDrafting ? 'CREATING DRAFTS...' : `PUSH (${selectedForBatch.length}) TO GMAIL DRAFTS`}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {draftSuccessMessage && (
          <div className="bg-[#00f044]/15 border-b border-[#00f044]/30 px-3.5 py-2.5 text-xs text-[#00f044] font-mono flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 truncate">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold truncate">{draftSuccessMessage}</span>
            </div>
            <a 
              href="https://mail.google.com/mail/u/0/#drafts" 
              target="_blank" 
              rel="noreferrer" 
              className="underline font-bold hover:text-white shrink-0 ml-2"
            >
              Open Drafts &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Mobile Mode Switcher Tabs (Only visible on screens < lg) */}
      <div className="lg:hidden flex items-center bg-[#1c1e24] p-1 rounded-md border border-[#3e424f] shadow-inner gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('roster')}
          className={`flex-1 py-2.5 px-3 rounded text-xs font-mono font-bold transition flex items-center justify-center space-x-2 ${
            mobileTab === 'roster'
              ? 'bg-[#00d4ff] text-[#121316] shadow-sm font-black'
              : 'text-[#a6abb8] hover:text-white'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>ROSTER ({filteredLabels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('inspector')}
          className={`flex-1 py-2.5 px-3 rounded text-xs font-mono font-bold transition flex items-center justify-center space-x-2 truncate ${
            mobileTab === 'inspector'
              ? 'bg-[#ffa020] text-[#121316] shadow-sm font-black'
              : 'text-[#a6abb8] hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">INSPECT: {selectedTarget.labelName}</span>
        </button>
      </div>

      {/* Main Grid: Roster & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (5 cols): The Label Roster */}
        <div className={`lg:col-span-5 bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden ${
          mobileTab === 'roster' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_5px_#00d4ff] inline-block" />
              <h3 className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
                LABELS ({filteredLabels.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-[11px] font-mono text-[#00d4ff] hover:text-white uppercase transition py-1 px-1.5"
            >
              {selectedForBatch.length === filteredLabels.length ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
          </div>

          <div className="p-3 bg-[#24262c] space-y-3">
            {/* Territory Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-[#1a1c22] p-1.5 rounded border border-[#3e424f] text-[11px] font-mono overflow-x-auto no-scrollbar">
              {(['ALL', 'Europe', 'USA', 'New Zealand', 'Japan', 'South America', 'Global'] as const).map(t => {
                const count = t === 'ALL' ? labels.length : labels.filter(l => l.territory === t).length;
                const labelText = 
                  t === 'ALL' ? `ALL (${count})` :
                  t === 'Europe' ? `🇪🇺 EU (${count})` :
                  t === 'USA' ? `🇺🇸 US (${count})` :
                  t === 'New Zealand' ? `🇳🇿 NZ (${count})` :
                  t === 'Japan' ? `🇯🇵 JP (${count})` :
                  t === 'South America' ? `🌎 SA (${count})` : `🌏 GLOBAL (${count})`;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterTerritory(t)}
                    className={`py-1.5 px-2.5 rounded text-center font-bold transition whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
                      filterTerritory === t
                        ? 'bg-[#383c46] text-white shadow-sm ring-1 ring-[#00d4ff]/40'
                        : 'text-[#888d9d] hover:text-white hover:bg-[#282a32]'
                    }`}
                  >
                    {labelText}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#888d9d] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search label, contact, city, or connection..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded pl-9 pr-8 py-2 text-[16px] lg:text-xs text-white placeholder-[#707584] focus:outline-none focus:border-[#00d4ff] font-mono"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#888d9d] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Tip */}
            <div className="lg:hidden text-[10px] font-mono text-[#8e93a2] flex items-center justify-between px-1">
              <span>Tap any card to review its pitch &rarr;</span>
              <span>{selectedForBatch.length} selected</span>
            </div>

            {/* Label Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredLabels.map((target) => {
                const isSelected = target.id === selectedId;
                const isChecked = selectedForBatch.includes(target.id);
                const territoryBadgeColor = 
                  target.territory === 'Europe' ? 'text-[#50a8ff] bg-[#50a8ff]/10 border-[#50a8ff]/30' :
                  target.territory === 'USA' ? 'text-[#ff761a] bg-[#ff761a]/10 border-[#ff761a]/30' :
                  target.territory === 'New Zealand' ? 'text-[#00f044] bg-[#00f044]/10 border-[#00f044]/30' :
                  target.territory === 'Japan' ? 'text-[#ff3e6c] bg-[#ff3e6c]/10 border-[#ff3e6c]/30' :
                  target.territory === 'South America' ? 'text-[#ffd000] bg-[#ffd000]/10 border-[#ffd000]/30' :
                  'text-[#b45aff] bg-[#b45aff]/10 border-[#b45aff]/30';

                const territoryLabel =
                  target.territory === 'Europe' ? '🇪🇺 EU' :
                  target.territory === 'USA' ? '🇺🇸 US' :
                  target.territory === 'New Zealand' ? '🇳🇿 NZ' :
                  target.territory === 'Japan' ? '🇯🇵 JP' :
                  target.territory === 'South America' ? '🌎 SA' : '🌏 GLOBAL';

                return (
                  <div
                    key={target.id}
                    onClick={() => handleSelectCard(target.id)}
                    className={`p-3 sm:p-3.5 rounded-md border text-left cursor-pointer transition relative space-y-2 ${
                      isSelected
                        ? 'bg-[#323640] border-[#00d4ff] ring-1 ring-[#00d4ff]/50 shadow-sm'
                        : 'bg-[#2a2d35] border-[#3e424f] hover:bg-[#30333d]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 truncate">
                        <label 
                          onClick={e => e.stopPropagation()} 
                          className="p-1 -m-1 cursor-pointer flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedForBatch(prev => prev.filter(id => id !== target.id));
                              } else {
                                setSelectedForBatch(prev => [...prev, target.id]);
                              }
                            }}
                            className="w-4 h-4 rounded border-[#434754] text-[#00d4ff] focus:ring-0 bg-[#18191f] cursor-pointer"
                          />
                        </label>
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {target.labelName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {target.hasReleasedGeeTee && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border text-[#00f044] bg-[#00f044]/10 border-[#00f044]/30" title="Gee Tee Alumni: Michael Barker subject referral">
                            ⚡ GEE TEE
                          </span>
                        )}
                        <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${territoryBadgeColor}`}>
                          {territoryLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#a6abb8] font-mono">
                      <span className="text-white font-medium">{target.name}</span>
                      <span className="text-[#888d9d] truncate text-[11px]">{target.location}</span>
                    </div>

                    <p className="text-[11px] text-[#ffa020] font-mono line-clamp-1">
                      ★ {target.connection}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-[#383b46] text-[10.5px] font-mono">
                      <span className="text-[#8e93a2] truncate max-w-[200px]">{target.email}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        target.status === 'drafted' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40' :
                        target.status === 'sent' ? 'bg-[#00f044]/20 text-[#00f044]' :
                        'bg-[#1a1c22] text-[#888d9d]'
                      }`}>
                        {target.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Live Inspector & Edit Console */}
        <div className={`lg:col-span-7 bg-[#2e3138] border border-[#434754] rounded-md shadow-sm overflow-hidden sticky top-16 sm:top-20 ${
          mobileTab === 'inspector' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="bg-[#383c46] border-b border-[#434754] px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 truncate">
              {/* Back button for mobile */}
              <button
                type="button"
                onClick={() => setMobileTab('roster')}
                className="lg:hidden p-1.5 -ml-1 text-[#00d4ff] hover:text-white rounded bg-[#252830] border border-[#484c5b] flex items-center space-x-1"
                title="Back to label list"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold uppercase">ROSTER</span>
              </button>

              <span className="w-2 h-2 rounded-full bg-[#ffa020] shadow-[0_0_5px_#ffa020] inline-block shrink-0 hidden sm:inline-block" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono truncate">
                {selectedTarget.labelName}
              </h3>
            </div>

            {/* Stepper & Desktop Tools */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] font-mono text-[#8e93a2] mr-1 hidden sm:inline">
                {currentIndex + 1} of {filteredLabels.length}
              </span>

              {/* Prev / Next buttons */}
              <button
                type="button"
                onClick={handlePrevLabel}
                disabled={!hasPrev}
                className="p-1.5 rounded bg-[#282a31] hover:bg-[#343740] disabled:opacity-30 text-[#d6d9e0] border border-[#484c5b] transition"
                title="Previous Label"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextLabel}
                disabled={!hasNext}
                className="p-1.5 rounded bg-[#282a31] hover:bg-[#343740] disabled:opacity-30 text-[#d6d9e0] border border-[#484c5b] transition"
                title="Next Label"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => handleCopy(selectedTarget.id)}
                className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-[#282a31] hover:bg-[#343740] text-[#d6d9e0] border border-[#484c5b] transition flex items-center space-x-1"
                title="Copy ready pitch to clipboard"
              >
                {copiedId === selectedTarget.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00f044]" />
                    <span className="text-[#00f044]">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#50a8ff]" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-[#282a31] space-y-3.5">
            {/* Metadata LCD Panel */}
            <div className="bg-[#141519] border border-[#383b48] rounded p-2.5 text-xs font-mono space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[#8e93a2] text-[11px] pb-1.5 border-b border-[#292c36] gap-1">
                <div className="truncate">
                  <strong className="text-[#a6abb8]">TO:</strong>{' '}
                  <span className="text-white font-semibold">{selectedTarget.name}</span>{' '}
                  <span className="text-[#00d4ff]">&lt;{selectedTarget.email}&gt;</span>
                </div>
                <span className="text-[#00f044] shrink-0">{selectedTarget.location}</span>
              </div>
              <p className="text-[10.5px] text-[#ffa020] pt-0.5 leading-snug">
                <strong>Connection:</strong> {selectedTarget.notes}
              </p>
            </div>

            {/* Editable Subject Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8]">
                  SUBJECT LINE
                </label>
                {selectedTarget.hasReleasedGeeTee && (
                  <span className="text-[9.5px] font-mono text-[#00f044]">
                    ★ Gee Tee Alumni subject active
                  </span>
                )}
              </div>
              <input
                type="text"
                value={currentPitch.subject}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded px-3 py-2 text-[16px] lg:text-xs text-[#ffa020] font-mono focus:outline-none focus:border-[#00d4ff]"
              />
            </div>

            {/* Editable Body Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#a6abb8]">
                  EMAIL BODY (ZERO EM DASHES)
                </label>
                <span className="text-[10px] text-[#8e93a2] font-mono">
                  GREETING: <strong className="text-white">{selectedTarget.salutation}</strong>
                </span>
              </div>
              <textarea
                rows={15}
                value={currentPitch.body}
                onChange={e => handleBodyChange(e.target.value)}
                className="w-full bg-[#18191f] border border-[#3b3e4a] rounded p-3 text-[16px] lg:text-xs text-[#d6d9e0] focus:outline-none focus:border-[#00d4ff] leading-relaxed font-sans"
              />
            </div>

            {/* Action Bar for This Label */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-[#3b3e4a]">
              <div className="text-[11px] font-mono text-[#8e93a2] truncate">
                From: <span className="text-[#00f044] font-semibold">{senderName}</span> ({senderEmail})
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Tap Save To Gmail Drafts Button */}
                <button
                  type="button"
                  onClick={() => handlePushSingleDraft(selectedTarget.id)}
                  disabled={singleDraftingId === selectedTarget.id}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded text-xs font-mono font-bold bg-[#00d4ff] hover:bg-[#20dcff] disabled:opacity-50 text-[#121316] transition flex items-center justify-center space-x-1.5 uppercase shadow-sm"
                >
                  {singleDraftingId === selectedTarget.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SAVING DRAFT...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>SAVE TO GMAIL DRAFTS</span>
                    </>
                  )}
                </button>

                {/* 1-Tap Open In Gmail App / Compose */}
                <a
                  href={getGmailComposeUrl(selectedTarget)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded text-xs font-mono font-bold bg-[#ff761a] hover:bg-[#ff8630] text-[#121316] transition flex items-center justify-center space-x-1.5 uppercase shadow-sm"
                  title="Open in Gmail app or web compose"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>OPEN IN GMAIL</span>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Sticky Bottom Action Bar for Mobile (Only visible when viewing Roster on < lg screens) */}
      {mobileTab === 'roster' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#1e2026]/95 backdrop-blur-md border-t border-[#434754] z-30 lg:hidden flex items-center justify-between gap-3 shadow-2xl">
          <div className="flex flex-col text-xs font-mono">
            <span className="text-white font-bold">{selectedForBatch.length} LABELS SELECTED</span>
            <span className="text-[10px] text-[#8e93a2]">Pushes into Gmail Drafts folder</span>
          </div>

          <button
            type="button"
            onClick={handlePushBatchDrafts}
            disabled={isBatchDrafting || selectedForBatch.length === 0}
            className="px-4 py-2.5 rounded bg-[#00d4ff] hover:bg-[#20dcff] disabled:opacity-50 text-[#121316] font-mono font-black text-xs transition flex items-center space-x-1.5 uppercase shadow-md min-h-[44px]"
          >
            {isBatchDrafting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>{isBatchDrafting ? 'DRAFTING...' : `PUSH (${selectedForBatch.length}) DRAFTS`}</span>
          </button>
        </div>
      )}

    </div>
  );
}
