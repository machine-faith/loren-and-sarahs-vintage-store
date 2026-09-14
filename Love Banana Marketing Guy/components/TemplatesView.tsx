'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Save, 
  Sparkles, 
  ExternalLink, 
  Music, 
  Disc, 
  Trash2,
  Tag,
  Check
} from 'lucide-react';
import { PitchTemplate, Settings } from '@/lib/db';

interface TemplatesViewProps {
  templates: PitchTemplate[];
  settings: Settings;
  onSaveTemplate: (tpl: Partial<PitchTemplate> & { name: string; subject: string; body: string }) => Promise<void>;
}

export default function TemplatesView({ templates, settings, onSaveTemplate }: TemplatesViewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PitchTemplate>(templates[0]);
  const [editName, setEditName] = useState(templates[0]?.name || '');
  const [editCategory, setEditCategory] = useState(templates[0]?.target_category || 'Radio');
  const [editSubject, setEditSubject] = useState(templates[0]?.subject || '');
  const [editBody, setEditBody] = useState(templates[0]?.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectTemplate = (tpl: PitchTemplate) => {
    setSelectedTemplate(tpl);
    setEditName(tpl.name);
    setEditCategory(tpl.target_category);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  };

  const handleCreateNew = () => {
    const fresh: PitchTemplate = {
      id: '',
      name: 'New Custom Pitch',
      target_category: 'Radio',
      subject: 'Love Banana - "Seagull" (debut LP on Ragnar Records)',
      body: `Hey {{first_name}},\n\nI play guitar and sing in Love Banana from Sydney.\n\nOur new single "Seagull" drops September 16 via Ragnar Records (mastered by Mikey Young), taken from our debut album coming out later this year.\n\n• WAV Master: {{wav_url}}\n• EPK & Stream: {{epk_url}}\n\nWould love to hear your thoughts, and let me know if you'd be up for a quick interview or phone chat around the release?\n\nCheers,\nHenry Collins\nLove Banana`,
      created_at: new Date().toISOString()
    };
    setSelectedTemplate(fresh);
    setEditName(fresh.name);
    setEditCategory(fresh.target_category);
    setEditSubject(fresh.subject);
    setEditBody(fresh.body);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTemplate({
        id: selectedTemplate.id || undefined,
        name: editName,
        target_category: editCategory,
        subject: editSubject,
        body: editBody
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const dynamicTags = [
    { tag: '{{first_name}}', desc: "Recipient's first name (e.g. Marc)" },
    { tag: '{{outlet}}', desc: "Station or publication name (e.g. BBC 6 Music)" },
    { tag: '{{city}}', desc: "Recipient city (e.g. Manchester)" },
    { tag: '{{country}}', desc: "Recipient country" },
    { tag: '{{wav_url}}', desc: "Direct WAV master download link" },
    { tag: '{{artwork_url}}', desc: "High-res single artwork link" },
    { tag: '{{epk_url}}', desc: "Live band EPK link" },
    { tag: '{{album_url}}', desc: "Private album promo stream link" },
    { tag: '{{bandcamp_url}}', desc: "Love Banana Bandcamp page" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Love Banana Pitch Studio</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Craft authentic, personal emails that feel like 1-on-1 musician notes (not corporate marketing blasts)
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Love Banana EPK & Asset Quick-Ref Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#11141e] to-[#11141e] border border-amber-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Disc className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Love Banana Campaign Assets (Synced from EPK)</h2>
          </div>
          <span className="text-[11px] text-amber-400 font-mono">Any Direction LP (2026)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <a
            href={settings.epkUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
          >
            <span className="font-semibold">Band EPK & Videos</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>
          <a
            href={settings.albumUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
          >
            <span className="font-semibold">Album Promo Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>
          <a
            href={settings.wavDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
          >
            <span className="font-semibold">"Seagull" WAV Master</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>
          <a
            href={settings.artworkDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1017] hover:bg-gray-800 text-gray-300 border border-gray-800 transition"
          >
            <span className="font-semibold">Artwork Download</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>
        </div>
      </div>

      {/* Main Studio Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Template Selector List */}
        <div className="lg:col-span-4 bg-[#11141e] border border-gray-800/80 rounded-2xl p-3 space-y-2 shadow-sm">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Available Templates
          </div>
          {templates.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-3 rounded-xl cursor-pointer transition space-y-1 ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                    : 'hover:bg-[#151926] text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{tpl.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 uppercase font-semibold">
                    {tpl.target_category}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate font-mono">
                  {tpl.subject}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Template Editor & Dynamic Tags */}
        <div className="lg:col-span-8 bg-[#11141e] border border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Edit Pitch Template</h2>
              <p className="text-xs text-gray-400">
                Variables like <code>&#123;&#123;first_name&#125;&#125;</code> and <code>&#123;&#123;outlet&#125;&#125;</code> will be substituted automatically.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition shrink-0"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Template Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Target Media</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Radio">Radio</option>
                <option value="Blog">Blog</option>
                <option value="Magazine">Magazine</option>
                <option value="Curator">Curator</option>
                <option value="Venue">Venue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Subject Line</label>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Body</label>
            <textarea
              rows={14}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl p-3.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
            />
          </div>

          {/* Dynamic Tags Helper */}
          <div className="bg-[#0a0d13] border border-gray-800 rounded-xl p-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Available Personalization Tags (Click to copy)
            </span>
            <div className="flex flex-wrap gap-2">
              {dynamicTags.map((dt) => (
                <button
                  key={dt.tag}
                  type="button"
                  onClick={() => {
                    setEditBody(prev => `${prev} ${dt.tag}`);
                  }}
                  title={dt.desc}
                  className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-[10px] border border-gray-700 transition"
                >
                  {dt.tag}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
