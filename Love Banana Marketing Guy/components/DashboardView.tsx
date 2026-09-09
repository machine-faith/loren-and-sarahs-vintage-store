'use client';

import React from 'react';
import { 
  Users, 
  Send, 
  Inbox, 
  Radio, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight,
  Disc,
  Clock,
  Music2,
  ExternalLink
} from 'lucide-react';
import { Contact, OutboxItem, ReplyItem } from '@/lib/db';

interface DashboardViewProps {
  contacts: Contact[];
  outbox: OutboxItem[];
  replies: ReplyItem[];
  setActiveTab: (tab: string) => void;
  onSelectContactForPitch: (contactId: string) => void;
  onUpdateContactStage: (contactId: string, stage: Contact['stage']) => void;
}

export default function DashboardView({
  contacts,
  outbox,
  replies,
  setActiveTab,
  onSelectContactForPitch,
  onUpdateContactStage
}: DashboardViewProps) {
  const pendingOutbox = outbox.filter(o => o.status === 'draft' || o.status === 'approved');
  const sentOutbox = outbox.filter(o => o.status === 'sent');
  const unreadReplies = replies.filter(r => !r.is_read);

  // Conversion rate
  const replyRate = sentOutbox.length > 0 
    ? Math.round((replies.length / sentOutbox.length) * 100) 
    : 0;

  // Media breakdown
  const radioCount = contacts.filter(c => c.category === 'Radio').length;
  const blogCount = contacts.filter(c => c.category === 'Blog').length;
  const magCount = contacts.filter(c => c.category === 'Magazine').length;
  const otherCount = contacts.filter(c => c.category !== 'Radio' && c.category !== 'Blog' && c.category !== 'Magazine').length;

  const pipelineStages: Array<{ id: Contact['stage']; label: string; color: string; border: string }> = [
    { id: 'lead', label: 'Uncontacted Leads', color: 'bg-gray-800 text-gray-300', border: 'border-gray-700' },
    { id: 'drafted', label: 'Pitch Drafted', color: 'bg-amber-950/40 text-amber-300', border: 'border-amber-700/50' },
    { id: 'awaiting_approval', label: 'Needs Approval', color: 'bg-orange-950/40 text-orange-300', border: 'border-orange-700/50' },
    { id: 'sent', label: 'Pitch Sent', color: 'bg-blue-950/40 text-blue-300', border: 'border-blue-700/50' },
    { id: 'replied', label: 'Replied / Discussion', color: 'bg-emerald-950/40 text-emerald-300', border: 'border-emerald-700/50' },
    { id: 'won', label: 'Playlisted / Aired', color: 'bg-purple-950/40 text-purple-300', border: 'border-purple-700/50' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Album Campaign Callout Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-black">
                Active Campaign
              </span>
              <span className="text-xs text-amber-300/80 font-medium">Debut Album 'Any Direction'</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Love Banana — <span className="text-amber-400">"Seagull"</span> PR & Radio Push
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Targeting European indie stations, community radio, and underground music blogs for the lead single (Out Sept 16). Mastered by Mikey Young on Ragnar Records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://love-banana-epk.vercel.app/epk.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              <span>Live EPK</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <a
              href="https://love-banana-epk.vercel.app/album.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              <span>Album Pitch Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <button
              onClick={() => setActiveTab('contacts')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition"
            >
              <span>Select Contacts to Pitch</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reply Alert Banner (if unread reply exists) */}
      {unreadReplies.length > 0 && (
        <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-emerald-300">
                  ⚡️ {unreadReplies.length} New Reply Received!
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Action Recommended
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
                From <strong>{unreadReplies[0].from_name}</strong>: &ldquo;{unreadReplies[0].snippet}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('replies')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition shrink-0"
          >
            View Thread & Reply &rarr;
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div 
          onClick={() => setActiveTab('contacts')}
          className="cursor-pointer bg-[#11141e] border border-gray-800/80 hover:border-gray-700 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Contacts</span>
            <Users className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{contacts.length}</span>
            <span className="text-xs text-gray-400">media & radio</span>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-gray-400">
            <span className="text-amber-400 font-semibold">{radioCount} Radio</span>
            <span>•</span>
            <span className="text-blue-400 font-semibold">{blogCount} Blogs</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">{magCount} Mags</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('outbox')}
          className="cursor-pointer bg-[#11141e] border border-gray-800/80 hover:border-amber-500/50 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Staged in Outbox</span>
            <Disc className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-400">{pendingOutbox.length}</span>
            <span className="text-xs text-amber-300/80">awaiting review</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Human-in-the-loop queue</span>
            <span className="text-amber-400 font-medium group-hover:underline">Review &rarr;</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('outbox')}
          className="cursor-pointer bg-[#11141e] border border-gray-800/80 hover:border-gray-700 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Pitches Sent</span>
            <Send className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{sentOutbox.length}</span>
            <span className="text-xs text-gray-400">outbound</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">
            <span>Delivered via direct Gmail</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('replies')}
          className="cursor-pointer bg-[#11141e] border border-gray-800/80 hover:border-emerald-500/50 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Inbound Replies</span>
            <Inbox className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400">{replies.length}</span>
            <span className="text-xs text-emerald-300 font-medium">({replyRate}% rate)</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
            <span>{unreadReplies.length} unread response{unreadReplies.length === 1 ? '' : 's'}</span>
            <span className="text-emerald-400 font-medium group-hover:underline">View Inbox &rarr;</span>
          </div>
        </div>
      </div>

      {/* European Media Type Segment Progress */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>European Outlet Breakdown</span>
          </h2>
          <span className="text-xs text-gray-400">{contacts.length} total curated targets</span>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${contacts.length ? (radioCount / contacts.length) * 100 : 0}%` }} 
            className="bg-amber-400 h-full" 
            title={`Radio: ${radioCount}`}
          />
          <div 
            style={{ width: `${contacts.length ? (blogCount / contacts.length) * 100 : 0}%` }} 
            className="bg-blue-400 h-full" 
            title={`Blogs: ${blogCount}`}
          />
          <div 
            style={{ width: `${contacts.length ? (magCount / contacts.length) * 100 : 0}%` }} 
            className="bg-purple-400 h-full" 
            title={`Magazines: ${magCount}`}
          />
          <div 
            style={{ width: `${contacts.length ? (otherCount / contacts.length) * 100 : 0}%` }} 
            className="bg-emerald-400 h-full" 
            title={`Other: ${otherCount}`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-gray-300">Radio Stations:</span>
            <span className="font-bold text-white">{radioCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-gray-300">Music Blogs:</span>
            <span className="font-bold text-white">{blogCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span className="text-gray-300">Print / Zines:</span>
            <span className="font-bold text-white">{magCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-gray-300">Curators / Venues:</span>
            <span className="font-bold text-white">{otherCount}</span>
          </div>
        </div>
      </div>

      {/* HubSpot Style Kanban Pipeline Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Outreach Pipeline</h2>
            <p className="text-xs text-gray-400">Track how each radio station, blog, and magazine is progressing</p>
          </div>
          <button
            onClick={() => setActiveTab('contacts')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>Manage All Contacts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const stageContacts = contacts.filter(c => c.stage === stage.id);
            return (
              <div 
                key={stage.id} 
                className="bg-[#0f121a] border border-gray-800/80 rounded-xl p-3 flex flex-col min-h-[360px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{stageContacts.length}</span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {stageContacts.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-gray-600 italic">
                      Empty
                    </div>
                  ) : (
                    stageContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-[#151926] border border-gray-800/90 hover:border-amber-500/40 rounded-lg p-3 shadow-sm transition group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-white text-xs line-clamp-1 group-hover:text-amber-400 transition">
                            {contact.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">
                            {contact.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 font-medium">
                          {contact.outlet || 'Independent'}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60 text-[10px] text-gray-500">
                          <span className="truncate max-w-[90px]">{contact.city || contact.country || 'Europe'}</span>
                          
                          {/* Quick Stage Mover */}
                          <select
                            value={contact.stage}
                            onChange={(e) => onUpdateContactStage(contact.id, e.target.value as Contact['stage'])}
                            className="bg-gray-800 text-[10px] text-gray-300 rounded px-1 py-0.5 border border-gray-700 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="lead">Lead</option>
                            <option value="drafted">Drafted</option>
                            <option value="awaiting_approval">Review</option>
                            <option value="sent">Sent</option>
                            <option value="replied">Replied</option>
                            <option value="won">Aired</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
