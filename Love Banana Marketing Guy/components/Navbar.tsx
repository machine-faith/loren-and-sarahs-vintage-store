'use client';

import React, { useState } from 'react';
import { 
  Radio, 
  Users, 
  Send, 
  Inbox, 
  FileText, 
  Upload, 
  Settings, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2,
  Compass
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  outboxCount: number;
  unreadRepliesCount: number;
  isSimulation: boolean;
  onSyncReplies: () => Promise<void>;
  discoveryCount?: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  outboxCount,
  unreadRepliesCount,
  isSimulation,
  onSyncReplies,
  discoveryCount
}: NavbarProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await onSyncReplies();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Pipeline', icon: Radio },
    { id: 'discovery', label: 'Discovery', icon: Compass, badge: discoveryCount, badgeColor: 'bg-amber-500' },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'outbox', label: 'Outbox', icon: Send, badge: outboxCount },
    { id: 'replies', label: 'Replies', icon: Inbox, badge: unreadRepliesCount, badgeColor: 'bg-emerald-500' },
    { id: 'templates', label: 'Pitch Studio', icon: FileText },
    { id: 'import', label: 'HubSpot / CSV', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d1017]/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-xl">🍌</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white tracking-tight text-lg">Messenger Pigeon on Steroids</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Love Banana
                </span>
              </div>
              <p className="text-xs text-gray-400 -mt-0.5">PR & Radio Outreach Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-gray-800/90 text-amber-400 border border-gray-700/60 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold text-white ${
                      item.badgeColor || 'bg-amber-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Sync & Mode */}
          <div className="flex items-center space-x-3">
            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Check Gmail for incoming replies"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              {syncSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Synced!</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{syncing ? 'Checking...' : 'Check Replies'}</span>
                </>
              )}
            </button>

            {/* Mode Tag */}
            {isSimulation ? (
              <div 
                onClick={() => setActiveTab('settings')}
                className="cursor-pointer flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                title="Simulation mode active — click to configure real Gmail OAuth"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[11px]">Safe Sandbox</span>
              </div>
            ) : (
              <div 
                onClick={() => setActiveTab('settings')}
                className="cursor-pointer flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title="Connected to live Gmail account"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-[11px]">Gmail Linked</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-gray-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  isActive
                    ? 'bg-gray-800 text-amber-400 border border-gray-700'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className={`px-1 rounded-full text-[10px] font-bold text-white ${
                    item.badgeColor || 'bg-amber-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
