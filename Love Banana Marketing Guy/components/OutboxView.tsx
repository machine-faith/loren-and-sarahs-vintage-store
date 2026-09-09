'use client';

import React, { useState } from 'react';
import { 
  Send, 
  FileEdit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Mail, 
  Sparkles, 
  ExternalLink,
  CheckSquare,
  Square,
  Clock,
  X,
  Play
} from 'lucide-react';
import { OutboxItem, Contact } from '@/lib/db';

interface OutboxViewProps {
  outbox: Array<OutboxItem & { contact?: Contact | null }>;
  onSendEmails: (ids: string[]) => Promise<{ sentCount: number; failedCount: number }>;
  onDraftInGmail: (ids: string[]) => Promise<{ draftedCount: number }>;
  onUpdateOutboxItem: (id: string, updates: Partial<OutboxItem>) => Promise<void>;
  onDeleteOutboxItem: (id: string) => Promise<void>;
  onClearOutbox: (status?: OutboxItem['status']) => Promise<void>;
}

export default function OutboxView({
  outbox,
  onSendEmails,
  onDraftInGmail,
  onUpdateOutboxItem,
  onDeleteOutboxItem,
  onClearOutbox
}: OutboxViewProps) {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'sent' | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewingItem, setReviewingItem] = useState<(OutboxItem & { contact?: Contact | null }) | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  
  // Progress states
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [sendResultBanner, setSendResultBanner] = useState<string | null>(null);

  const pendingItems = outbox.filter(o => o.status === 'draft' || o.status === 'approved');
  const sentItems = outbox.filter(o => o.status === 'sent');

  const displayedItems = outbox.filter(item => {
    if (selectedTab === 'pending') return item.status === 'draft' || item.status === 'approved';
    if (selectedTab === 'sent') return item.status === 'sent';
    return true;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === displayedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedItems.map(d => d.id));
    }
  };

  const openReview = (item: OutboxItem & { contact?: Contact | null }) => {
    setReviewingItem(item);
    setEditSubject(item.subject);
    setEditBody(item.body);
  };

  const handleSaveEdit = async () => {
    if (!reviewingItem) return;
    await onUpdateOutboxItem(reviewingItem.id, {
      subject: editSubject,
      body: editBody,
      status: 'approved'
    });
    setReviewingItem(null);
  };

  const handleSendSingle = async (item: OutboxItem) => {
    setIsSending(true);
    try {
      const res = await onSendEmails([item.id]);
      setReviewingItem(null);
      setSendResultBanner(`Sent 1 email successfully!`);
      setTimeout(() => setSendResultBanner(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftSingle = async (item: OutboxItem) => {
    setIsDrafting(true);
    try {
      await onDraftInGmail([item.id]);
      setReviewingItem(null);
      setSendResultBanner(`Created draft in your Gmail account!`);
      setTimeout(() => setSendResultBanner(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendBatch = async () => {
    const idsToSend = selectedIds.length > 0 ? selectedIds : pendingItems.map(p => p.id);
    if (idsToSend.length === 0) return;

    if (!confirm(`Are you sure you want to send ${idsToSend.length} email(s) via Gmail now?`)) {
      return;
    }

    setIsSending(true);
    try {
      const res = await onSendEmails(idsToSend);
      setSelectedIds([]);
      setSendResultBanner(`Successfully sent ${res.sentCount} emails via Gmail!`);
      setTimeout(() => setSendResultBanner(null), 5000);
    } catch (e: any) {
      alert(`Error sending emails: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftBatch = async () => {
    const idsToDraft = selectedIds.length > 0 ? selectedIds : pendingItems.map(p => p.id);
    if (idsToDraft.length === 0) return;

    setIsDrafting(true);
    try {
      const res = await onDraftInGmail(idsToDraft);
      setSelectedIds([]);
      setSendResultBanner(`Successfully pushed ${res.draftedCount} drafts to your Gmail drafts folder!`);
      setTimeout(() => setSendResultBanner(null), 5000);
    } catch (e: any) {
      alert(`Error creating Gmail drafts: ${e.message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Banner */}
      {sendResultBanner && (
        <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/50 p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{sendResultBanner}</span>
          </div>
          <button onClick={() => setSendResultBanner(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Human-In-The-Loop Safety Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              The Safety Outbox
            </h1>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-2.5 py-1 rounded-full">
              {pendingItems.length} Drafts Awaiting Review
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Strict human-in-the-loop protection: <strong>no email is ever sent without your sign-off</strong>.
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Direct send locked. Push to Drafts to review & send from phone.</span>
          </div>

          <button
            onClick={handleDraftBatch}
            disabled={isDrafting || (selectedIds.length === 0 && pendingItems.length === 0)}
            title="Push all approved items to your Gmail Drafts folder"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00d4ff] hover:bg-[#20dcff] text-[#121316] shadow-sm transition disabled:opacity-50"
          >
            <Mail className="w-4 h-4 text-[#121316]" />
            <span>{isDrafting ? 'Drafting in Gmail...' : `Push ${selectedIds.length > 0 ? selectedIds.length : 'All'} to Gmail Drafts`}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedTab === 'pending'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Pending Review ({pendingItems.length})
          </button>
          <button
            onClick={() => setSelectedTab('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedTab === 'sent'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sent History ({sentItems.length})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedTab === 'all'
                ? 'bg-gray-800 text-gray-200 border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All Items ({outbox.length})
          </button>
        </div>

        {selectedTab === 'pending' && pendingItems.length > 0 && (
          <button
            onClick={() => onClearOutbox('draft')}
            className="text-[11px] text-gray-500 hover:text-red-400 transition"
          >
            Discard All Drafts
          </button>
        )}
      </div>

      {/* Outbox Items List */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-xl overflow-hidden shadow-sm">
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-300">No emails currently in this tab.</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Head to the <strong>Contacts</strong> tab, select the radio stations or blogs you want to reach, and hit <strong>Draft Pitch</strong>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {/* Table Header */}
            <div className="bg-[#0f121a] text-gray-400 uppercase text-[10px] tracking-wider px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button onClick={selectAll}>
                  {selectedIds.length === displayedItems.length && displayedItems.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <span>Recipient & Outlet</span>
              </div>
              <div className="flex items-center space-x-8">
                <span>Subject & Status</span>
                <span className="w-24 text-right">Actions</span>
              </div>
            </div>

            {displayedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const contact = item.contact;

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#151926] transition ${
                    isSelected ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button onClick={() => toggleSelect(item.id)} className="mt-1">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600 hover:text-gray-400" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">
                          {contact ? contact.name : 'Unknown Recipient'}
                        </span>
                        {contact?.outlet && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-semibold">
                            {contact.outlet}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          {contact ? contact.email : ''}
                        </span>
                      </div>

                      <div 
                        onClick={() => openReview(item)}
                        className="cursor-pointer group flex items-baseline space-x-2"
                      >
                        <p className="text-xs font-medium text-amber-300 group-hover:underline">
                          {item.subject}
                        </p>
                      </div>

                      <p className="text-[11px] text-gray-400 line-clamp-1 max-w-2xl font-mono">
                        {item.body.split('\n').filter(Boolean)[0] || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    {/* Status Badge */}
                    {item.status === 'sent' ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        <span>Sent</span>
                      </span>
                    ) : item.status === 'approved' ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span>Approved</span>
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Needs Review</span>
                      </span>
                    )}

                    {/* Action Buttons */}
                    <button
                      onClick={() => openReview(item)}
                      title="Inspect and edit email"
                      className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <FileEdit className="w-3 h-3 text-gray-400" />
                      <span>Review</span>
                    </button>

                    {item.status !== 'sent' && (
                      <button
                        onClick={() => handleDraftSingle(item)}
                        title="Push this draft to Gmail"
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteOutboxItem(item.id)}
                      title="Discard"
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Edit Email Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#11141e] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Inspect & Approve Pitch</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Recipient: <strong>{reviewingItem.contact?.name}</strong> &lt;{reviewingItem.contact?.email}&gt; ({reviewingItem.contact?.outlet})
                </p>
              </div>
              <button 
                onClick={() => setReviewingItem(null)} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Edit Form */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-[#0a0d13] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                  Email Body (1-on-1 Personal Format)
                </label>
                <textarea
                  rows={12}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-[#0a0d13] border border-gray-700 rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => {
                  onDeleteOutboxItem(reviewingItem.id);
                  setReviewingItem(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 self-start sm:self-auto"
              >
                Discard Draft
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleDraftSingle(reviewingItem)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d4ff] hover:bg-[#20dcff] text-[#121316] shadow-sm transition flex items-center space-x-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#121316]" />
                  <span>Push to Gmail Draft</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
