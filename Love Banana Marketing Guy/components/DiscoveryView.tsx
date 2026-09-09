'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Sparkles, 
  Radio, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  Download, 
  Play, 
  RefreshCw, 
  Filter, 
  AlertCircle, 
  FileText, 
  Layers, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Compass,
  Tag,
  MessageSquare
} from 'lucide-react';
import { DiscoveredLead } from '@/lib/db';

export default function DiscoveryView() {
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [crawlLog, setCrawlLog] = useState<string>('Ready. Select a preset or enter a domain to scan.');
  
  // Custom crawl inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customOutlet, setCustomOutlet] = useState('');
  const [customCategory, setCustomCategory] = useState<'Radio' | 'Blog' | 'Magazine' | 'Curator'>('Radio');

  // Filters & Tabs
  const [activeSubTab, setActiveSubTab] = useState<'direct_email' | 'web_form' | 'all'>('direct_email');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minVibeScore, setMinVibeScore] = useState<number>(0);

  // Selected lead for detail inspection
  const [selectedLead, setSelectedLead] = useState<DiscoveredLead | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedNotification, setApprovedNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/discovery');
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPreset = async (mode: string, label: string) => {
    try {
      setCrawling(true);
      setCrawlLog(`Scanning web & databases for ${label}...`);
      const res = await fetch('/api/discovery/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        setCrawlLog(`✓ ${data.message}`);
        await fetchLeads();
      } else {
        setCrawlLog(`⚠️ Scan error: ${data.error}`);
      }
    } catch (err: any) {
      setCrawlLog(`⚠️ Network error: ${err.message}`);
    } finally {
      setCrawling(false);
    }
  };

  const handleCustomCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    try {
      setCrawling(true);
      setCrawlLog(`Crawling ${customUrl} and auditing host platform...`);
      const res = await fetch('/api/discovery/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'custom',
          url: customUrl,
          outletName: customOutlet,
          category: customCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setCrawlLog(`✓ ${data.message}`);
        setCustomUrl('');
        setCustomOutlet('');
        await fetchLeads();
      } else {
        setCrawlLog(`⚠️ Crawl error: ${data.error}`);
      }
    } catch (err: any) {
      setCrawlLog(`⚠️ Error: ${err.message}`);
    } finally {
      setCrawling(false);
    }
  };

  const handleApprove = async (leadId: string) => {
    try {
      setApprovingId(leadId);
      const res = await fetch('/api/discovery/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      const data = await res.json();
      if (data.success) {
        setApprovedNotification(data.message);
        setTimeout(() => setApprovedNotification(null), 4000);
        // Update local status
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'approved' } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, status: 'approved' } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/discovery/export?format=${format}`, '_blank');
  };

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    if (activeSubTab === 'direct_email' && l.submissionType !== 'direct_email') return false;
    if (activeSubTab === 'web_form' && l.submissionType !== 'web_form') return false;
    if (categoryFilter !== 'all' && l.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (l.vibeScore < minVibeScore) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchOutlet = l.outlet.toLowerCase().includes(q);
      const matchName = l.name.toLowerCase().includes(q);
      const matchEmail = l.pitchEmail?.toLowerCase().includes(q) || false;
      const matchCountry = l.country.toLowerCase().includes(q);
      const matchCity = l.city.toLowerCase().includes(q);
      const matchTag = l.vibeTags?.some(t => t.toLowerCase().includes(q)) || false;
      if (!matchOutlet && !matchName && !matchEmail && !matchCountry && !matchCity && !matchTag) return false;
    }
    return true;
  });

  const directCount = leads.filter(l => l.submissionType === 'direct_email').length;
  const webFormCount = leads.filter(l => l.submissionType === 'web_form').length;
  const highVibeCount = leads.filter(l => l.vibeScore >= 80).length;

  return (
    <div className="space-y-4 pb-12">
      {/* Device: Global Web Discovery Radar */}
      <div className="bg-[#2e3138] border border-[#434754] rounded-sm shadow-md overflow-hidden">
        {/* Device Header Bar */}
        <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f044] shadow-[0_0_6px_#00f044]"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#a2a8b8] font-bold">
              DEVICE 05: GLOBAL WEB DISCOVERY RADAR & VIBE ENGINE
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase bg-[#23262d] hover:bg-[#343842] text-[#d6dae5] border border-[#434754] rounded-sm transition flex items-center gap-1.5"
              title="Download full directory as CSV"
            >
              <Download className="w-3 h-3 text-[#ff761a]" />
              <span>EXP CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase bg-[#23262d] hover:bg-[#343842] text-[#d6dae5] border border-[#434754] rounded-sm transition flex items-center gap-1.5"
              title="Download as JSON database"
            >
              <Layers className="w-3 h-3 text-[#00f044]" />
              <span>EXP JSON</span>
            </button>
          </div>
        </div>

        {/* Chassis Body */}
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#ff761a]" />
                <span>Autonomous Web Scraper & Platform Auditor</span>
              </h1>
              <p className="text-xs text-[#8e94a5] mt-0.5">
                Deep-crawls college radio databases, indie blogs, Reddit, Discord, and community stations matching Love Banana's garage-pop vibe.
              </p>
            </div>
          </div>

          {/* Quick Hardware LCD Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#141519] border border-[#22252d] p-2.5 rounded-sm">
              <div className="text-[10px] font-mono uppercase text-[#73798c]">Global Leads</div>
              <div className="text-xl font-mono font-bold text-white mt-0.5">{leads.length}</div>
            </div>
            <div className="bg-[#141519] border border-[#22252d] p-2.5 rounded-sm">
              <div className="text-[10px] font-mono uppercase text-[#00f044]">Direct Pitch Emails</div>
              <div className="text-xl font-mono font-bold text-[#00f044] mt-0.5">{directCount}</div>
            </div>
            <div className="bg-[#141519] border border-[#22252d] p-2.5 rounded-sm">
              <div className="text-[10px] font-mono uppercase text-[#ffa020]">Web Form Portals</div>
              <div className="text-xl font-mono font-bold text-[#ffa020] mt-0.5">{webFormCount}</div>
            </div>
            <div className="bg-[#141519] border border-[#22252d] p-2.5 rounded-sm">
              <div className="text-[10px] font-mono uppercase text-[#ff761a]">High Vibe (80%+)</div>
              <div className="text-xl font-mono font-bold text-[#ff761a] mt-0.5">{highVibeCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {approvedNotification && (
        <div className="flex items-center justify-between bg-[#141519] border border-[#00f044] px-4 py-2.5 rounded-sm text-[#00f044] text-xs font-mono shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#00f044]" />
            <span>{approvedNotification}</span>
          </div>
          <button 
            onClick={() => setApprovedNotification(null)}
            className="text-gray-400 hover:text-white uppercase font-bold text-[10px]"
          >
            [CLOSE]
          </button>
        </div>
      )}

      {/* Device: Crawler Controls & Macro Triggers */}
      <div className="bg-[#2e3138] border border-[#434754] rounded-sm shadow-md overflow-hidden">
        {/* Device Header Bar */}
        <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#ff761a]"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#a2a8b8] font-bold">
              DEVICE 06: MULTI-CHANNEL MACRO SCANNERS
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#73798c]">ENGINE CLOCK: ACTIVE</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Preset Buttons - Session View Clip Slot Look */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => handleRunPreset('us_college', 'US & Canada College Radio (NACC)')}
              disabled={crawling}
              className="p-2.5 rounded-sm bg-[#23262d] hover:bg-[#343842] border border-[#3e424e] hover:border-[#ff761a] transition text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">🇺🇸</span>
                <span className="text-[9px] font-mono text-[#8e94a5] border border-[#434754] px-1 rounded-sm">NACC</span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[#ff761a] transition mt-1">US College</div>
              <div className="text-[10px] text-[#73798c]">KEXP, KALX, CMJ</div>
            </button>

            <button
              onClick={() => handleRunPreset('uk_euro', 'UK & European Indie Radio')}
              disabled={crawling}
              className="p-2.5 rounded-sm bg-[#23262d] hover:bg-[#343842] border border-[#3e424e] hover:border-[#ff761a] transition text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">🇬🇧</span>
                <span className="text-[9px] font-mono text-[#8e94a5] border border-[#434754] px-1 rounded-sm">EURO</span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[#ff761a] transition mt-1">UK & Europe</div>
              <div className="text-[10px] text-[#73798c]">BBC 6, Resonance, ByteFM</div>
            </button>

            <button
              onClick={() => handleRunPreset('culture', 'Global Garage Blogs & DIY Labels')}
              disabled={crawling}
              className="p-2.5 rounded-sm bg-[#23262d] hover:bg-[#343842] border border-[#3e424e] hover:border-[#ff761a] transition text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">📝</span>
                <span className="text-[9px] font-mono text-[#8e94a5] border border-[#434754] px-1 rounded-sm">PRESS</span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[#ff761a] transition mt-1">Garage Blogs</div>
              <div className="text-[10px] text-[#73798c]">Austin Town Hall, Post-Trash</div>
            </button>

            <button
              onClick={() => handleRunPreset('reddit', 'Reddit Music Hubs (r/GarageRock)')}
              disabled={crawling}
              className="p-2.5 rounded-sm bg-[#23262d] hover:bg-[#343842] border border-[#3e424e] hover:border-[#ff761a] transition text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">💬</span>
                <span className="text-[9px] font-mono text-[#8e94a5] border border-[#434754] px-1 rounded-sm">THREADS</span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[#ff761a] transition mt-1">Reddit Hubs</div>
              <div className="text-[10px] text-[#73798c]">r/GarageRock & Indie</div>
            </button>

            <button
              onClick={() => handleRunPreset('deep_verify_australia', 'Deep-Audit Australian Stations')}
              disabled={crawling}
              className="p-2.5 rounded-sm bg-[#23262d] hover:bg-[#343842] border border-[#3e424e] hover:border-[#ff761a] transition text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">🇦🇺</span>
                <span className="text-[9px] font-mono text-[#8e94a5] border border-[#434754] px-1 rounded-sm">AUS</span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[#ff761a] transition mt-1">Audit AUS</div>
              <div className="text-[10px] text-[#73798c]">264 websites verified</div>
            </button>
          </div>

          {/* Custom Domain Deep Scrape Form */}
          <form onSubmit={handleCustomCrawl} className="bg-[#1e2026] border border-[#383c46] rounded-sm p-3 space-y-2">
            <div className="text-[11px] font-mono uppercase text-[#a2a8b8] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5 text-[#ff761a]" />
                Custom Domain Platform Audit:
              </span>
              <span className="text-[10px] text-[#73798c]">Extracts CMS, contact emails & portals</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="https://station-or-blog.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-[#141519] border border-[#383c46] rounded-sm px-3 py-1.5 text-xs text-white placeholder-[#545969] focus:outline-none focus:border-[#ff761a] font-mono"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Outlet Name (Optional)"
                  value={customOutlet}
                  onChange={(e) => setCustomOutlet(e.target.value)}
                  className="w-full bg-[#141519] border border-[#383c46] rounded-sm px-3 py-1.5 text-xs text-white placeholder-[#545969] focus:outline-none focus:border-[#ff761a]"
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full bg-[#141519] border border-[#383c46] rounded-sm px-2.5 py-1.5 text-xs text-[#d6dae5] focus:outline-none focus:border-[#ff761a] font-mono"
                >
                  <option value="Radio">Radio</option>
                  <option value="Blog">Blog</option>
                  <option value="Magazine">Magazine</option>
                  <option value="Curator">Curator</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={crawling || !customUrl}
                  className="w-full bg-[#ff761a] hover:bg-[#ff8a38] disabled:opacity-50 text-[#121316] font-mono font-black uppercase px-3 py-1.5 rounded-sm text-xs transition flex items-center justify-center space-x-1 shadow-sm"
                >
                  {crawling ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>CRAWL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Ableton LCD Live Crawl Ticker */}
          <div className="bg-[#141519] border border-[#22252d] rounded-sm px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#00f044] font-mono overflow-hidden">
              <span className={`w-2 h-2 rounded-full ${crawling ? 'bg-[#ff761a] animate-ping' : 'bg-[#00f044]'}`}></span>
              <span className="truncate text-[11px]">{crawlLog}</span>
            </div>
            <button
              onClick={fetchLeads}
              title="Refresh list"
              className="text-[#73798c] hover:text-white ml-2 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Device: Main Leads Directory & Matrix */}
      <div className="bg-[#2e3138] border border-[#434754] rounded-sm shadow-md overflow-hidden">
        {/* Device Header Bar */}
        <div className="bg-[#383c46] border-b border-[#434754] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f044] shadow-[0_0_6px_#00f044]"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#a2a8b8] font-bold">
              DEVICE 07: DISCOVERED LEADS & TRACK MATRIX
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#ffa020] font-bold">
            FILTERED: {filteredLeads.length} / {leads.length} UNITS
          </span>
        </div>

        {/* Navigation Tabs & Filters */}
        <div className="p-3 border-b border-[#383c46] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#23262d]">
          {/* Subtabs */}
          <div className="flex items-center space-x-1 bg-[#141519] p-1 rounded-sm border border-[#383c46]">
            <button
              onClick={() => setActiveSubTab('direct_email')}
              className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase transition flex items-center space-x-1.5 ${
                activeSubTab === 'direct_email'
                  ? 'bg-[#ff761a] text-[#121316] shadow-sm'
                  : 'text-[#8e94a5] hover:text-white'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Direct Email ({directCount})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('web_form')}
              className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase transition flex items-center space-x-1.5 ${
                activeSubTab === 'web_form'
                  ? 'bg-[#ff761a] text-[#121316] shadow-sm'
                  : 'text-[#8e94a5] hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Web Forms ({webFormCount})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase transition ${
                activeSubTab === 'all'
                  ? 'bg-[#ff761a] text-[#121316] shadow-sm'
                  : 'text-[#8e94a5] hover:text-white'
              }`}
            >
              <span>All ({leads.length})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-[#545969]" />
              <input
                type="text"
                placeholder="Search leads, cities, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#141519] border border-[#383c46] rounded-sm pl-7 pr-3 py-1.5 text-xs text-white placeholder-[#545969] focus:outline-none focus:border-[#ff761a] font-mono w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#141519] border border-[#383c46] rounded-sm px-2.5 py-1.5 text-xs text-[#d6dae5] focus:outline-none focus:border-[#ff761a] font-mono"
            >
              <option value="all">All Outlets</option>
              <option value="radio">Radio</option>
              <option value="blog">Blog</option>
              <option value="magazine">Magazine</option>
              <option value="curator">Curator</option>
              <option value="community">Community / Forum</option>
              <option value="label">DIY Label</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#d6dae5] divide-y divide-[#383c46]">
            <thead className="bg-[#1e2026] text-[#73798c] uppercase text-[10px] tracking-wider font-mono font-bold">
              <tr>
                <th className="px-4 py-2.5">Outlet / Target</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Submission Type</th>
                <th className="px-4 py-2.5">Host Platform</th>
                <th className="px-4 py-2.5">Vibe</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383c46]/60 font-mono text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#73798c]">
                    <Compass className="w-8 h-8 mx-auto text-[#545969] mb-2 animate-bounce" />
                    <p className="text-sm font-bold text-gray-300">No leads match your current filter.</p>
                    <p className="text-xs text-[#73798c] mt-1">Try launching one of the preset crawlers above.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isApproved = lead.status === 'approved';
                  const isWebForm = lead.submissionType === 'web_form';

                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-[#383c46]/50 transition cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* Outlet / Target */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {lead.category === 'Radio' ? '📻' : lead.category === 'Blog' ? '📝' : lead.category === 'Curator' ? '🎧' : lead.category === 'Label' ? '📼' : '💬'}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{lead.outlet}</span>
                              {lead.websiteUrl && (
                                <a 
                                  href={lead.websiteUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#73798c] hover:text-[#ff761a]"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8e94a5]">
                              {lead.contactPerson || lead.name} {lead.role ? `• ${lead.role}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-2.5">
                        <div className="text-[#d6dae5]">{lead.country}</div>
                        <div className="text-[10px] text-[#73798c]">{lead.city || lead.state || ''}</div>
                      </td>

                      {/* Submission Type & Contact */}
                      <td className="px-4 py-2.5">
                        {lead.submissionType === 'direct_email' ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00f044] bg-[#00f044]/10 px-1.5 py-0.5 rounded-sm border border-[#00f044]/30 w-max">
                              <Send className="w-2.5 h-2.5" /> Direct Email
                            </span>
                            <span className="text-[10px] text-[#a2a8b8] font-mono mt-0.5">{lead.pitchEmail || 'Inside profile'}</span>
                          </div>
                        ) : lead.submissionType === 'web_form' ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ffa020] bg-[#ffa020]/10 px-1.5 py-0.5 rounded-sm border border-[#ffa020]/30 w-max">
                              <FileText className="w-2.5 h-2.5" /> Online Form
                            </span>
                            <span className="text-[10px] text-[#73798c] mt-0.5">Web portal</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9d72ff] bg-[#9d72ff]/10 px-1.5 py-0.5 rounded-sm border border-[#9d72ff]/30 w-max">
                              <MessageSquare className="w-2.5 h-2.5" /> Community
                            </span>
                            <span className="text-[10px] text-[#73798c] mt-0.5">{lead.sourcePlatform}</span>
                          </div>
                        )}
                      </td>

                      {/* Host CMS / Platform */}
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#141519] text-[#a2a8b8] border border-[#383c46]">
                          {lead.hostPlatform}
                        </span>
                      </td>

                      {/* Vibe Match & Tier Badge */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-sm ${
                            lead.vibeScore >= 80 ? 'bg-[#ff761a]/20 text-[#ff761a] border border-[#ff761a]/40' :
                            lead.vibeScore >= 60 ? 'bg-[#50a8ff]/20 text-[#50a8ff] border border-[#50a8ff]/40' :
                            'bg-[#00f044]/15 text-[#00f044] border border-[#00f044]/30'
                          }`}>
                            {lead.vibeScore}%
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                            lead.affinityTier === 'tier1_bullseye'
                              ? 'bg-[#ff761a]/15 text-[#ff761a] border border-[#ff761a]/30'
                              : lead.affinityTier === 'tier2_indie'
                              ? 'bg-[#50a8ff]/15 text-[#50a8ff] border border-[#50a8ff]/30'
                              : 'bg-[#00f044]/15 text-[#00f044] border border-[#00f044]/30'
                          }`}>
                            {lead.affinityTier === 'tier1_bullseye' ? '🎯 Bulls-Eye' : lead.affinityTier === 'tier2_indie' ? '🎸 Indie/Alt' : '📻 Eclectic'}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#73798c] truncate max-w-[140px] mt-0.5">
                          {lead.vibeTags?.[0] || 'Indie Outlet'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#00f044] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Queued
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#73798c]">
                            Discovered
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isWebForm ? (
                          <a
                            href={lead.webFormUrl || lead.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm bg-[#ffa020]/10 hover:bg-[#ffa020]/20 text-[#ffa020] border border-[#ffa020]/30 text-[10px] font-mono font-bold uppercase transition"
                          >
                            <span>FORM</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleApprove(lead.id)}
                            disabled={isApproved || approvingId === lead.id}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase transition ${
                              isApproved
                                ? 'bg-[#141519] text-[#73798c] border border-[#383c46] cursor-default'
                                : 'bg-[#ff761a] hover:bg-[#ff8a38] text-[#121316]'
                            }`}
                          >
                            {approvingId === lead.id ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            ) : isApproved ? (
                              <span>QUEUED</span>
                            ) : (
                              <>
                                <Send className="w-2.5 h-2.5" />
                                <span>APPROVE</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dossier Modal / Inspector */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2e3138] border border-[#434754] rounded-sm max-w-xl w-full p-5 shadow-2xl space-y-4 relative">
            {/* Header strip */}
            <div className="flex items-start justify-between border-b border-[#434754] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff761a] font-mono">
                  LEAD AUDIT DOSSIER // INSPECTOR
                </span>
                <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                  {selectedLead.outlet}
                  {selectedLead.websiteUrl && (
                    <a 
                      href={selectedLead.websiteUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#73798c] hover:text-[#ff761a]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </h3>
                <p className="text-xs text-[#8e94a5]">
                  {selectedLead.country} {selectedLead.city ? `• ${selectedLead.city}` : ''} ({selectedLead.category})
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-[#73798c] uppercase">Vibe Match</div>
                <div className="text-2xl font-mono font-black text-[#ff761a]">{selectedLead.vibeScore}%</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {selectedLead.vibeTags?.map((tag, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#141519] text-[#ffa020] border border-[#383c46]">
                  {tag}
                </span>
              ))}
            </div>

            {/* Audit Details Box */}
            <div className="bg-[#141519] border border-[#22252d] rounded-sm p-3.5 space-y-2.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Host Platform / CMS</span>
                  <span className="text-white font-bold">{selectedLead.hostPlatform}</span>
                </div>
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Submission Route</span>
                  <span className="font-bold text-white capitalize">
                    {selectedLead.submissionType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedLead.pitchEmail && (
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Direct Pitch Email</span>
                  <span className="text-[#00f044] font-bold text-sm">
                    {selectedLead.pitchEmail}
                  </span>
                </div>
              )}

              {selectedLead.webFormUrl && (
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Submission Portal URL</span>
                  <a 
                    href={selectedLead.webFormUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#ffa020] hover:underline break-all"
                  >
                    {selectedLead.webFormUrl}
                  </a>
                </div>
              )}

              {selectedLead.guidelines && (
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Guidelines & File Formats</span>
                  <p className="text-[#d6dae5] font-sans text-xs mt-0.5 leading-relaxed">{selectedLead.guidelines}</p>
                </div>
              )}

              {selectedLead.notes && (
                <div>
                  <span className="text-[#73798c] text-[10px] block uppercase">Scraper Notes</span>
                  <p className="text-[#8e94a5] font-sans italic text-xs mt-0.5">{selectedLead.notes}</p>
                </div>
              )}

              {/* Context-Aware DecisionRecord (Reasoning Chain) */}
              {selectedLead.decision_record && (
                <div className="border-t border-[#2a2d36] pt-2.5 mt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#ff761a] font-bold uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Decision Reasoning Audit (Why this contact?)
                    </span>
                    <span className="text-[10px] font-mono text-[#00f044] font-bold">
                      CONFIDENCE: {selectedLead.decision_record.confidenceScore}%
                    </span>
                  </div>

                  <div className="bg-[#0e0f13] border border-[#2a2d36] rounded p-2 text-[11px] space-y-1.5 font-mono">
                    <div>
                      <span className="text-[#73798c] text-[9px] block uppercase">Role Classification:</span>
                      <span className="text-white font-bold">{selectedLead.decision_record.selectionRole}</span>
                    </div>

                    <div>
                      <span className="text-[#73798c] text-[9px] block uppercase">Selection Rationale:</span>
                      <span className="text-[#d6dae5] font-sans text-xs leading-relaxed">{selectedLead.decision_record.selectionRationale}</span>
                    </div>

                    {selectedLead.decision_record.sonicMatchesFound && selectedLead.decision_record.sonicMatchesFound.length > 0 && (
                      <div>
                        <span className="text-[#73798c] text-[9px] block uppercase">Sonic Anchors Matched:</span>
                        <span className="text-[#ffa020] font-mono text-[10px]">
                          {selectedLead.decision_record.sonicMatchesFound.join(', ')}
                        </span>
                      </div>
                    )}

                    {selectedLead.decision_record.discardedEmails && selectedLead.decision_record.discardedEmails.length > 0 && (
                      <div>
                        <span className="text-[#73798c] text-[9px] block uppercase">Discarded Candidates (Filtered Out):</span>
                        <div className="space-y-0.5 mt-1">
                          {selectedLead.decision_record.discardedEmails.map((d, i) => (
                            <div key={i} className="text-[10px] text-[#8e94a5] flex items-center justify-between">
                              <span className="line-through text-red-400/80">{d.email}</span>
                              <span className="text-[9px] text-[#545969] italic">{d.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase text-[#8e94a5] hover:text-white bg-[#23262d] border border-[#434754] transition"
              >
                CLOSE
              </button>

              <div className="flex items-center space-x-2">
                {selectedLead.submissionType === 'web_form' ? (
                  <a
                    href={selectedLead.webFormUrl || selectedLead.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase bg-[#ff761a] hover:bg-[#ff8a38] text-[#121316] transition shadow-sm"
                  >
                    <span>OPEN PORTAL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedLead.id)}
                    disabled={selectedLead.status === 'approved' || approvingId === selectedLead.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase bg-[#ff761a] hover:bg-[#ff8a38] disabled:opacity-50 text-[#121316] transition shadow-sm"
                  >
                    {selectedLead.status === 'approved' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>IN OUTBOX</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>APPROVE & QUEUE</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
