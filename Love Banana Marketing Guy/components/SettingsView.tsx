'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  Key, 
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Check
} from 'lucide-react';
import { Settings } from '@/lib/db';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (updates: Partial<Settings>) => Promise<void>;
}

export default function SettingsView({ settings, onSaveSettings }: SettingsViewProps) {
  const [formData, setFormData] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authUrlLoading, setAuthUrlLoading] = useState(false);

  const handleChange = (key: keyof Settings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setAuthUrlLoading(true);
    try {
      // First save current client ID / secret
      await onSaveSettings(formData);

      const res = await fetch('/api/auth/google');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Please enter your Google Client ID and Secret first.');
      }
    } catch (e: any) {
      alert(`OAuth error: ${e.message}`);
    } finally {
      setAuthUrlLoading(false);
    }
  };

  const isSim = formData.simulationMode === 'true';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-amber-400" />
            <span>Settings & Gmail Connection</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure your personal Gmail credentials and band campaign assets
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-black" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Gmail Connection Card */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gmail Integration</h2>
              <p className="text-xs text-gray-400">
                Send 1-on-1 personal pitches directly through your real Gmail address
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2 bg-[#0d1017] p-1.5 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => handleChange('simulationMode', 'true')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                isSim ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Safe Sandbox
            </button>
            <button
              type="button"
              onClick={() => handleChange('simulationMode', 'false')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                !isSim ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Live Gmail
            </button>
          </div>
        </div>

        {/* Current Status Message */}
        {isSim ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">Sandbox / Simulation Mode Active</span>
              <p className="text-gray-300">
                You can draft pitches, click "Send All Approved", and test reply notifications without connecting real Google credentials. When you're ready to send real emails to BBC, FIP, and blogs, connect your Google Cloud credentials below!
              </p>
            </div>
          </div>
        ) : formData.googleRefreshToken ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Gmail Linked Successfully! ({formData.fromEmail})</span>
            </div>
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="text-xs text-emerald-400 hover:underline"
            >
              Reconnect
            </button>
          </div>
        ) : null}

        {/* Google OAuth Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Google Cloud Client ID
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                value={formData.googleClientId}
                onChange={(e) => handleChange('googleClientId', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Google Cloud Client Secret
              </label>
              <input
                type="password"
                placeholder="e.g. GOCSPX-xxxxxxxxxxxxxx"
                value={formData.googleClientSecret}
                onChange={(e) => handleChange('googleClientSecret', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={authUrlLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-gray-200 transition shadow flex items-center space-x-2"
            >
              <Mail className="w-4 h-4 text-red-500" />
              <span>{authUrlLoading ? 'Connecting...' : 'Authorize Gmail Account via Google'}</span>
            </button>

            <span className="text-[11px] text-gray-500 font-mono">
              Redirect URI: http://localhost:3000/api/auth/callback
            </span>
          </div>

          {/* Quick Setup Guide Accordion */}
          <details className="bg-[#0a0d13] border border-gray-800 rounded-xl p-4 text-xs text-gray-300">
            <summary className="font-semibold text-amber-400 cursor-pointer flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How to get free Google OAuth credentials in 2 minutes</span>
            </summary>
            <ol className="list-decimal list-inside space-y-1.5 mt-3 text-gray-400 pl-1 leading-relaxed">
              <li>Open <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Google Cloud Console</a> and create a free project (e.g. "Love Banana Outreach").</li>
              <li>Go to <strong>APIs & Services &rarr; Library</strong> and enable <strong>Gmail API</strong>.</li>
              <li>Go to <strong>OAuth consent screen</strong> &rarr; Select <strong>External</strong>, add your email, and add the scopes: <code>gmail.send</code>, <code>gmail.compose</code>, <code>gmail.readonly</code>, <code>gmail.modify</code>.</li>
              <li>Go to <strong>Credentials &rarr; Create Credentials &rarr; OAuth client ID</strong>. Select <em>Web application</em>.</li>
              <li>Under <strong>Authorized redirect URIs</strong>, add: <code>http://localhost:3000/api/auth/callback</code></li>
              <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> into the fields above and click <strong>Authorize Gmail Account</strong>!</li>
            </ol>
          </details>
        </div>
      </div>

      {/* Love Banana Profile & Campaign Assets */}
      <div className="bg-[#11141e] border border-gray-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="border-b border-gray-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🍌</span>
            <span>Love Banana Campaign Profile</span>
          </h2>
          <p className="text-xs text-gray-400">
            Information injected into your pitch templates and outbox drafts
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Band Name</label>
              <input
                type="text"
                value={formData.bandName}
                onChange={(e) => handleChange('bandName', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Contact / Sender Name</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Sender Email</label>
              <input
                type="email"
                value={formData.fromEmail}
                onChange={(e) => handleChange('fromEmail', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Lead Single</label>
              <input
                type="text"
                value={formData.singleTitle}
                onChange={(e) => handleChange('singleTitle', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Single Release Date</label>
              <input
                type="text"
                value={formData.singleReleaseDate}
                onChange={(e) => handleChange('singleReleaseDate', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Album Title</label>
              <input
                type="text"
                value={formData.albumTitle}
                onChange={(e) => handleChange('albumTitle', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Record Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Mastering Engineer</label>
              <input
                type="text"
                value={formData.masteredBy}
                onChange={(e) => handleChange('masteredBy', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Live EPK URL</label>
              <input
                type="url"
                value={formData.epkUrl}
                onChange={(e) => handleChange('epkUrl', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Album Promo Stream URL</label>
              <input
                type="url"
                value={formData.albumUrl}
                onChange={(e) => handleChange('albumUrl', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">"Seagull" WAV Master Download URL</label>
              <input
                type="url"
                value={formData.wavDownloadUrl}
                onChange={(e) => handleChange('wavDownloadUrl', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Single Artwork Download URL</label>
              <input
                type="url"
                value={formData.artworkDownloadUrl}
                onChange={(e) => handleChange('artworkDownloadUrl', e.target.value)}
                className="w-full bg-[#0a0d13] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
