'use client';

// ==============================================================================
// Small Software Cloud - Hosted App Viewer (/a/[id])
// Features Sandboxed iframe isolation and Host postMessage Bridge
// ==============================================================================

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { App, User } from '@/types';
import { MOCK_USERS } from '@/lib/storage';
import ShareModal from '@/components/ShareModal';
import { 
  Share2, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

import { Suspense } from 'react';

function HostedAppContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appId = resolvedParams.id;

  const [app, setApp] = useState<App | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default Alice
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'idle'>('idle');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    fetchApp();
  }, [appId, currentUser.id]);

  async function fetchApp() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${appId}?userId=${currentUser.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Access Denied: You do not have permission to view this tool.');
      } else {
        setApp(data.app);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load app');
    } finally {
      setIsLoading(false);
    }
  }

  // Setup BroadcastChannel for Realtime Sync between multiple browser tabs/windows
  useEffect(() => {
    const channelName = `cloud_realtime_${appId}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { key, value, updatedBy } = event.data || {};
      if (key && iframeRef.current && iframeRef.current.contentWindow) {
        setSyncStatus('syncing');
        // Push broadcast into the sandboxed iframe
        iframeRef.current.contentWindow.postMessage({
          type: 'SDK_BROADCAST',
          appId,
          key,
          value,
          updatedBy
        }, '*');
        setTimeout(() => setSyncStatus('connected'), 400);
      }
    };

    return () => {
      channel.close();
    };
  }, [appId]);

  // Host postMessage Bridge Listener (Secure Gateway between iframe and platform)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'cloud_sdk') return;

      const { type, requestId, payload } = data;

      if (type === 'SDK_READY') {
        setSyncStatus('connected');
        return;
      }

      if (type === 'GET_USER') {
        replyIframe(requestId, true, {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email
        });
        return;
      }

      if (type === 'STORE_GET') {
        fetch(`/api/bridge/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STORE_GET', key: payload?.key, userId: currentUser.id })
        })
          .then(res => res.json())
          .then(result => replyIframe(requestId, true, result.data))
          .catch(err => replyIframe(requestId, false, null, err.message));
        return;
      }

      if (type === 'STORE_SET') {
        setSyncStatus('syncing');
        fetch(`/api/bridge/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'STORE_SET',
            key: payload?.key,
            value: payload?.value,
            userId: currentUser.id
          })
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              replyIframe(requestId, true, true);
              // Broadcast update to all other open tabs/viewers via BroadcastChannel
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                  key: payload?.key,
                  value: payload?.value,
                  updatedBy: currentUser.id
                });
              }
              setSyncStatus('connected');
            } else {
              replyIframe(requestId, false, null, result.error);
            }
          })
          .catch(err => replyIframe(requestId, false, null, err.message));
        return;
      }

      if (type === 'STORE_LIST') {
        fetch(`/api/bridge/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'STORE_LIST', prefix: payload?.prefix, userId: currentUser.id })
        })
          .then(res => res.json())
          .then(result => replyIframe(requestId, true, result.keys))
          .catch(err => replyIframe(requestId, false, null, err.message));
        return;
      }

      if (type === 'STORE_SUBSCRIBE') {
        replyIframe(requestId, true, true);
        return;
      }
    }

    function replyIframe(requestId: string, success: boolean, data?: any, error?: string) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SDK_RESPONSE',
          requestId,
          success,
          data,
          error
        }, '*');
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [appId, currentUser]);

  function reloadIframe() {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Connecting to secure sandbox...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-100 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-500 mb-1">Try switching test account:</div>
            <div className="flex justify-center gap-2 mb-4">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    currentUser.id === user.id
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {user.name.split(' ')[0]}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
        
        {/* Left: App Info */}
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate max-w-xs md:max-w-md">{app.title}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {app.role === 'owner' ? 'Owner' : app.role === 'editor' ? 'Editor' : 'Viewer'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Realtime Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Realtime Sync Active'}</span>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Switch Active Test Account */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="truncate max-w-[100px]">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-xl hidden group-hover:block z-20">
              <div className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase">Switch Test Role</div>
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    currentUser.id === user.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{user.name}</span>
                  <span className="text-[10px] opacity-75">{user.email.split('@')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={reloadIframe}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reload App"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(app.role === 'owner' || app.role === 'editor') && (
            <Link
              href={`/studio/${app.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Studio</span>
            </Link>
          )}

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Sandboxed App Container */}
      <main className="flex-1 w-full bg-slate-950 relative">
        <iframe
          ref={iframeRef}
          src={`/embed/${appId}?userId=${currentUser.id}`}
          title={app.title}
          sandbox="allow-scripts" // Strict security: NO allow-same-origin
          className="w-full h-full border-0 bg-transparent"
        />
      </main>

      {/* Google-Docs-Style Sharing Modal */}
      {isShareModalOpen && (
        <ShareModal
          app={app}
          currentUserId={currentUser.id}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onAppUpdated={(updated) => setApp(updated)}
        />
      )}
    </div>
  );
}

export default function HostedAppPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading tool...</p>
        </div>
      </div>
    }>
      <HostedAppContent params={params} />
    </Suspense>
  );
}

