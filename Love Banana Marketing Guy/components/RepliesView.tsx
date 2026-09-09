'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Radio, 
  ExternalLink, 
  Mail,
  Send,
  Clock,
  RotateCw
} from 'lucide-react';
import { ReplyItem, Contact } from '@/lib/db';

interface RepliesViewProps {
  replies: Array<ReplyItem & { contact?: Contact | null }>;
  onMarkRead: (id: string) => Promise<void>;
  onSimulateReply: (contactId?: string) => Promise<void>;
  onSyncReplies: () => Promise<void>;
  setActiveTab: (tab: string) => void;
  onDraftReply: (contactId: string, subject: string) => void;
}

export default function RepliesView({
  replies,
  onMarkRead,
  onSimulateReply,
  onSyncReplies,
  setActiveTab,
  onDraftReply
}: RepliesViewProps) {
  const [selectedReply, setSelectedReply] = useState<(ReplyItem & { contact?: Contact | null }) | null>(
    replies[0] || null
  );
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const unreadCount = replies.filter(r => !r.is_read).length;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncReplies();
    } finally {
      setSyncing(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await onSimulateReply();
    } finally {
      setSimulating(false);
    }
  };

  const handleSelect = (r: ReplyItem & { contact?: Contact | null }) => {
    setSelectedReply(r);
    if (!r.is_read) {
      onMarkRead(r.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Inbox className="w-6 h-6 text-emerald-400" />
              <span>Inbound Replies & Feedback</span>
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-emerald-500 text-black font-bold px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Responses from station DJs, music editors, and playlist curators
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition"
            title="Trigger a test inbound reply to test notifications & pipeline movement"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulating ? 'Simulating...' : 'Simulate Test Reply'}</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{syncing ? 'Checking Gmail...' : 'Check Gmail Replies'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Inbox View */}
      {replies.length === 0 ? (
        <div className="bg-[#11141e] border border-gray-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-300">No replies recorded yet.</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Once you start sending pitches from the Outbox, the Reply Watchdog automatically detects when someone writes back, flags it here, and moves their deal card to "Replied".
          </p>
          <button
            onClick={handleSimulate}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition inline-flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate a Sample DJ Reply Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Reply List */}
          <div className="lg:col-span-5 bg-[#11141e] border border-gray-800/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-800/60">
            {replies.map((reply) => {
              const isSelected = selectedReply?.id === reply.id;
              return (
                <div
                  key={reply.id}
                  onClick={() => handleSelect(reply)}
                  className={`p-4 cursor-pointer transition flex items-start space-x-3 ${
                    isSelected ? 'bg-emerald-500/10 border-l-4 border-l-emerald-400' : 'hover:bg-[#151926]'
                  }`}
                >
                  <div className="shrink-0 mt-1">
                    {!reply.is_read ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block animate-pulse" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-600 block" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {reply.from_name || reply.from_email}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(reply.received_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {reply.contact?.outlet && (
                      <div className="text-[11px] font-semibold text-emerald-400">
                        {reply.contact.outlet} ({reply.contact.category})
                      </div>
                    )}

                    <div className="text-xs text-gray-300 font-medium truncate">
                      {reply.subject}
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2">
                      {reply.snippet}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Thread Detail */}
          <div className="lg:col-span-7 bg-[#11141e] border border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-6">
            {selectedReply ? (
              <>
                {/* Thread Header */}
                <div className="border-b border-gray-800 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedReply.subject}
                      </h2>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                        <span>From:</span>
                        <strong className="text-emerald-300">{selectedReply.from_name}</strong>
                        <span>&lt;{selectedReply.from_email}&gt;</span>
                      </div>
                    </div>

                    {selectedReply.contact?.outlet && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedReply.contact.outlet}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-[11px] text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(selectedReply.received_at).toLocaleString()}</span>
                    </div>
                    {selectedReply.contact?.city && (
                      <span>Location: {selectedReply.contact.city}, {selectedReply.contact.country}</span>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-[#0a0d13] border border-gray-800/80 rounded-xl p-5 text-gray-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedReply.body || selectedReply.snippet}
                </div>

                {/* Response Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-gray-400">
                    Stage automatically updated to: <strong className="text-emerald-400">Replied / Discussion</strong>
                  </span>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (selectedReply.contact_id) {
                          onDraftReply(
                            selectedReply.contact_id,
                            selectedReply.subject.startsWith('Re:') 
                              ? selectedReply.subject 
                              : `Re: ${selectedReply.subject}`
                          );
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Draft Quick Follow-Up</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-gray-500 text-xs">
                Select a reply on the left to read the full message.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
