'use client';

// ==============================================================================
// Small Software Cloud - Dashboard (/dashboard)
// Tabs: "My Apps" and "Shared With Me", with Rename, Duplicate, Delete & Share
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { App, User } from '@/types';
import { MOCK_USERS } from '@/lib/storage';
import ShareModal from '@/components/ShareModal';
import { 
  Plus, 
  Layers, 
  Users, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Copy, 
  Trash2, 
  Edit3, 
  MoreVertical,
  Globe,
  Lock,
  ChevronDown,
  Cloud
} from 'lucide-react';

export default function DashboardPage() {
  const [tab, setTab] = useState<'my' | 'shared'>('my');
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default Alice
  const [activeMenuAppId, setActiveMenuAppId] = useState<string | null>(null);
  const [sharingApp, setSharingApp] = useState<App | null>(null);
  const [renamingApp, setRenamingApp] = useState<App | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchApps();
  }, [tab, currentUser]);

  async function fetchApps() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/apps?tab=${tab}&userId=${currentUser.id}&email=${currentUser.email}`);
      const data = await res.json();
      if (data.apps) setApps(data.apps);
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDuplicate(appId: string) {
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', userId: currentUser.id })
      });
      const data = await res.json();
      if (data.app) {
        fetchApps();
      }
    } catch (err) {
      console.error('Error duplicating app:', err);
    } finally {
      setActiveMenuAppId(null);
    }
  }

  async function handleDelete(appId: string) {
    if (!confirm('Are you sure you want to delete this app?')) return;
    try {
      await fetch(`/api/apps/${appId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      setApps(apps.filter(a => a.id !== appId));
    } catch (err) {
      console.error('Error deleting app:', err);
    } finally {
      setActiveMenuAppId(null);
    }
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingApp || !newTitle.trim()) return;

    try {
      const res = await fetch(`/api/apps/${renamingApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), userId: currentUser.id })
      });
      const data = await res.json();
      if (data.app) {
        setApps(apps.map(a => a.id === renamingApp.id ? { ...a, title: data.app.title } : a));
      }
    } catch (err) {
      console.error('Error renaming app:', err);
    } finally {
      setRenamingApp(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Small Software Cloud</span>
          </Link>
        </div>

        {/* User Role Switcher (Multi-Account Demonstration) */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Acting as: <strong>{currentUser.name}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div className="absolute right-0 mt-1 w-56 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl hidden group-hover:block z-30">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Switch Test Account
              </div>
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    currentUser.id === user.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-[10px] opacity-75">{user.email}</div>
                  </div>
                  {currentUser.id === user.id && <span className="text-[10px]">Active</span>}
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/studio"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tool</span>
          </Link>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        
        {/* Banner / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Your Small Software</h1>
            <p className="text-sm text-slate-400 mt-1">
              Micro-apps created by you or shared across your team with realtime persistence.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTab('my')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                tab === 'my' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Apps</span>
            </button>
            <button
              onClick={() => setTab('shared')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                tab === 'shared' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Shared With Me</span>
            </button>
          </div>
        </div>

        {/* App Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">
              {tab === 'my' ? 'No tools created yet' : 'No tools shared with you yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              {tab === 'my'
                ? 'Describe any small software you need and generate it as a self-contained app in seconds.'
                : 'When team members invite you to collaborate, their apps will appear here.'}
            </p>
            {tab === 'my' && (
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Tool</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app) => (
              <div
                key={app.id}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between shadow-lg transition-all"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {app.role === 'owner' ? 'Owner' : app.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                      {app.link_access === 'view' ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Restricted
                        </span>
                      )}
                    </div>

                    {/* Context Action Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuAppId === app.id && (
                        <div className="absolute right-0 mt-1 w-40 rounded-xl bg-slate-950 border border-slate-800 p-1 shadow-2xl z-30 animate-in fade-in">
                          {app.role === 'owner' && (
                            <button
                              onClick={() => { setRenamingApp(app); setNewTitle(app.title); setActiveMenuAppId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Rename</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(app.id)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={() => { setSharingApp(app); setActiveMenuAppId(null); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>
                          {app.role === 'owner' && (
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* App Title */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                    {app.title}
                  </h3>

                  {/* Prompt summary */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-normal">
                    {app.current_version?.prompt || 'Single-file cloud micro app'}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Updated {new Date(app.updated_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {(app.role === 'owner' || app.role === 'editor') && (
                      <Link
                        href={`/studio/${app.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Edit in Studio"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Studio</span>
                      </Link>
                    )}

                    <Link
                      href={`/a/${app.id}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open Live App"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rename Dialog Modal */}
      {renamingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold mb-3 text-slate-100">Rename Tool</h3>
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 mb-4"
                required
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingApp(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingApp && (
        <ShareModal
          app={sharingApp}
          currentUserId={currentUser.id}
          isOpen={!!sharingApp}
          onClose={() => setSharingApp(null)}
          onAppUpdated={(updated) => {
            setApps(apps.map(a => a.id === updated.id ? updated : a));
          }}
        />
      )}
    </div>
  );
}
