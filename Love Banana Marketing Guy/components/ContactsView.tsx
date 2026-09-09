'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Send, 
  Trash2, 
  Radio, 
  CheckSquare, 
  Square,
  Sparkles,
  ExternalLink,
  MapPin,
  Tag,
  X
} from 'lucide-react';
import { Contact, PitchTemplate } from '@/lib/db';

interface ContactsViewProps {
  contacts: Contact[];
  templates: PitchTemplate[];
  onAddContact: (contact: Partial<Contact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onUpdateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  onGenerateDrafts: (contactIds: string[], templateId: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export default function ContactsView({
  contacts,
  templates,
  onAddContact,
  onDeleteContact,
  onUpdateContact,
  onGenerateDrafts,
  setActiveTab
}: ContactsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);

  // New contact form state
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    outlet: '',
    category: 'Radio',
    country: '',
    city: '',
    genre_fit: 'Garage Pop, Indie Rock',
    notes: '',
    stage: 'lead'
  });

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.outlet.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStage = selectedStage === 'all' || c.stage === selectedStage;

    return matchesSearch && matchesCategory && matchesStage;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const handleCreateDrafts = async () => {
    if (selectedIds.length === 0 || !selectedTemplateId) return;
    try {
      setIsGenerating(true);
      await onGenerateDrafts(selectedIds, selectedTemplateId);
      setShowPitchModal(false);
      setSelectedIds([]);
      setActiveTab('outbox');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) return;
    await onAddContact(newContact);
    setShowAddModal(false);
    setNewContact({
      name: '',
      email: '',
      outlet: '',
      category: 'Radio',
      country: '',
      city: '',
      genre_fit: 'Garage Pop, Indie Rock',
      notes: '',
      stage: 'lead'
    });
  };

  const getCategoryBadgeClass = (category: Contact['category']) => {
    switch (category) {
      case 'Radio':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Blog':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Magazine':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'Curator':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Media & Radio Contacts</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
              {contacts.length}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            DJs, station programmers, music journalists, and curators
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('import')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <span>Import CSV / HubSpot</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, outlet, city, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1017] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Pills */}
          <div className="flex items-center bg-[#0d1017] p-1 rounded-lg border border-gray-800 text-xs">
            {['all', 'Radio', 'Blog', 'Magazine'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat}
              </button>
            ))}
          </div>

          {/* Stage Dropdown */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-[#0d1017] border border-gray-800 text-xs text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stages</option>
            <option value="lead">Lead</option>
            <option value="drafted">Drafted</option>
            <option value="awaiting_approval">Needs Approval</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="won">Aired / Booked</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-amber-300">
              {selectedIds.length} contact{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPitchModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft Pitch for Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0f121a] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-3 w-10">
                  <button onClick={selectAll} className="text-gray-400 hover:text-white">
                    {selectedIds.length === filteredContacts.length && filteredContacts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="p-3">Contact & Email</th>
                <th className="p-3">Outlet / Station</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location</th>
                <th className="p-3">Sound Fit & Notes</th>
                <th className="p-3">Stage</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 italic">
                    No contacts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-[#151926] transition ${isSelected ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="p-3">
                        <button onClick={() => toggleSelect(contact.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-600 hover:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white text-xs">{contact.name}</div>
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="text-gray-400 hover:text-amber-400 transition text-[11px]"
                        >
                          {contact.email}
                        </a>
                      </td>
                      <td className="p-3 font-semibold text-gray-200">
                        {contact.outlet || '—'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryBadgeClass(contact.category)}`}>
                          {contact.category}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {[contact.city, contact.country].filter(Boolean).join(', ') || 'Europe'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="text-gray-300 truncate text-[11px] font-medium">{contact.genre_fit}</div>
                        {contact.notes && (
                          <div className="text-gray-500 text-[10px] truncate">{contact.notes}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={contact.stage}
                          onChange={(e) => onUpdateContact(contact.id, { stage: e.target.value as Contact['stage'] })}
                          className="bg-gray-800 text-[11px] text-gray-200 rounded px-2 py-1 border border-gray-700 focus:outline-none"
                        >
                          <option value="lead">Lead</option>
                          <option value="drafted">Drafted</option>
                          <option value="awaiting_approval">Needs Approval</option>
                          <option value="sent">Sent</option>
                          <option value="replied">Replied</option>
                          <option value="won">Aired</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedIds([contact.id]);
                              setShowPitchModal(true);
                            }}
                            title="Draft pitch for this contact"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-amber-500 hover:text-black text-amber-400 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteContact(contact.id)}
                            title="Delete contact"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Draft Pitch for Selected */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#11141e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generate Pitches ({selectedIds.length} Contacts)</span>
              </h3>
              <button 
                onClick={() => setShowPitchModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-300">
                Pick a campaign template. Personalized drafts will be generated and placed directly into your <strong>Outbox Review Queue</strong>. You will be able to inspect, edit, and approve them before sending!
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Select Campaign Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-[#0d1017] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.target_category}] {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template snippet preview */}
              {(() => {
                const activeTpl = templates.find(t => t.id === selectedTemplateId);
                return activeTpl ? (
                  <div className="bg-[#0a0d13] border border-gray-800 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Subject Line:</span>
                    <p className="text-gray-200 font-mono text-[11px]">{activeTpl.subject}</p>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowPitchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDrafts}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5"
              >
                {isGenerating ? (
                  <span>Generating Drafts...</span>
                ) : (
                  <>
                    <span>Generate & Go to Outbox</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Single Contact */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#11141e] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Media Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marc Riley"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. marc@bbc.co.uk"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Outlet / Station</label>
                  <input
                    type="text"
                    placeholder="e.g. BBC 6 Music"
                    value={newContact.outlet}
                    onChange={(e) => setNewContact({ ...newContact, outlet: e.target.value })}
                    className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={newContact.category}
                    onChange={(e) => setNewContact({ ...newContact, category: e.target.value as Contact['category'] })}
                    className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Radio">Radio</option>
                    <option value="Blog">Blog</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Curator">Curator</option>
                    <option value="Venue">Venue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United Kingdom"
                    value={newContact.country}
                    onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                    className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Manchester"
                    value={newContact.city}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Sound / Format Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Loves scuzzy Aussie punk, evening show"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full bg-[#0d1017] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
