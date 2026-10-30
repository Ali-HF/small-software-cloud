'use client';

// ==============================================================================
// Small Software Cloud - Hosted App Viewer (/a/[id])
// Features Sandboxed iframe isolation, Host postMessage Bridge,
// BroadcastChannel + Supabase Realtime sync, and Design System Token UI
// ==============================================================================

import React, { useEffect, useState, useRef, use, Suspense } from 'react';
import Link from 'next/link';
import { App, User } from '@/types';
import {
  MOCK_USERS,
  getStoredMockUser,
  setStoredMockUser,
} from '@/lib/storage';
import { supabase, hasSupabase, getSupabaseSessionUser } from '@/lib/supabase';
import ShareModal from '@/components/ShareModal';
import {
  Share2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ChevronDown,
  Sun,
  Moon,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  InlineAlert,
  useTheme,
} from '@/components/ui';

function HostedAppContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const appId = resolvedParams.id;
  const { resolvedTheme, setTheme } = useTheme();

  const [app, setApp] = useState<App | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    'connected' | 'syncing' | 'readonly'
  >('connected');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const stored = getStoredMockUser();
    setCurrentUser(stored);
    if (hasSupabase()) {
      getSupabaseSessionUser().then((u) => {
        if (u) setCurrentUser(u);
      });
    }
  }, []);

  useEffect(() => {
    fetchApp();
  }, [appId, currentUser.id]);

  async function fetchApp() {
    setIsLoading(true);
    setError(null);
    setPermissionNotice(null);
    try {
      const res = await fetch(
        `/api/apps/${appId}?userId=${encodeURIComponent(
          currentUser.id
        )}&email=${encodeURIComponent(currentUser.email)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setApp(null);
        setError(
          data.error ||
            'Access Denied: You do not have permission to view this tool.'
        );
      } else {
        setApp(data.app);
        if (
          data.app.role === 'viewer' ||
          data.app.role === 'link_viewer'
        ) {
          setSyncStatus('readonly');
        } else {
          setSyncStatus('connected');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load app');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSwitchUser(user: User) {
    setStoredMockUser(user);
    setCurrentUser(user);
    setIsAccountMenuOpen(false);
  }

  // Setup BroadcastChannel + Supabase Realtime for live multiplayer sync
  useEffect(() => {
    const channelName = `cloud_realtime_${appId}`;
    const bc = new BroadcastChannel(channelName);
    broadcastChannelRef.current = bc;

    const pushUpdateToIframe = (
      key: string,
      value: any,
      updatedBy?: string | null
    ) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setSyncStatus('syncing');
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'SDK_BROADCAST',
            appId,
            key,
            value,
            updatedBy,
          },
          '*'
        );
        setTimeout(() => {
          setSyncStatus(
            app?.role === 'viewer' || app?.role === 'link_viewer'
              ? 'readonly'
              : 'connected'
          );
        }, 400);
      }
    };

    bc.onmessage = (event) => {
      const { key, value, updatedBy } = event.data || {};
      if (key) {
        pushUpdateToIframe(key, value, updatedBy);
      }
    };

    // Subscribe to Supabase Realtime Postgres Changes on app_kv when configured
    let sbChannel: any = null;
    if (supabase) {
      sbChannel = supabase
        .channel(`app_kv_${appId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_kv',
            filter: `app_id=eq.${appId}`,
          },
          (payload: any) => {
            const row = payload.new;
            if (row && row.key !== undefined) {
              pushUpdateToIframe(row.key, row.value, row.updated_by);
            }
          }
        )
        .subscribe();
    }

    return () => {
      bc.close();
      if (sbChannel && supabase) {
        supabase.removeChannel(sbChannel);
      }
    };
  }, [appId, app?.role]);

  // Host postMessage Bridge Listener (Secure Gateway between untrusted iframe and platform)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'cloud_sdk') return;

      const { type, requestId, payload } = data;

      if (type === 'SDK_READY') {
        setSyncStatus(
          app?.role === 'viewer' || app?.role === 'link_viewer'
            ? 'readonly'
            : 'connected'
        );
        return;
      }

      if (type === 'GET_USER') {
        const isAnonymous = app?.role === 'link_viewer';
        replyIframe(
          requestId,
          true,
          isAnonymous
            ? null
            : {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
              }
        );
        return;
      }

      if (type === 'STORE_GET') {
        fetch(`/api/bridge/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'STORE_GET',
            key: payload?.key,
            userId: currentUser.id,
            userEmail: currentUser.email,
          }),
        })
          .then((res) => res.json())
          .then((result) => replyIframe(requestId, true, result.data))
          .catch((err) => replyIframe(requestId, false, null, err.message));
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
            userId: currentUser.id,
            userEmail: currentUser.email,
          }),
        })
          .then(async (res) => {
            const result = await res.json();
            return { ok: res.ok, result };
          })
          .then(({ ok, result }) => {
            if (ok && result.success) {
              setPermissionNotice(null);
              replyIframe(requestId, true, true);
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                  key: payload?.key,
                  value: payload?.value,
                  updatedBy: currentUser.id,
                });
              }
              setSyncStatus('connected');
            } else {
              const errMsg =
                result.error ||
                'Permission denied: Read-only access for viewers.';
              setPermissionNotice(errMsg);
              setSyncStatus('readonly');
              replyIframe(requestId, false, null, errMsg);
              // Re-sync authoritative state back into iframe so optimistic UI reverts cleanly
              fetch(`/api/bridge/${appId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'STORE_GET',
                  key: payload?.key,
                  userId: currentUser.id,
                  userEmail: currentUser.email,
                }),
              })
                .then((r) => r.json())
                .then((authoritative) => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      {
                        type: 'SDK_BROADCAST',
                        appId,
                        key: payload?.key,
                        value: authoritative.data,
                      },
                      '*'
                    );
                  }
                })
                .catch(() => {});
            }
          })
          .catch((err) => replyIframe(requestId, false, null, err.message));
        return;
      }

      if (type === 'STORE_LIST') {
        fetch(`/api/bridge/${appId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'STORE_LIST',
            prefix: payload?.prefix,
            userId: currentUser.id,
            userEmail: currentUser.email,
          }),
        })
          .then((res) => res.json())
          .then((result) => replyIframe(requestId, true, result.keys))
          .catch((err) => replyIframe(requestId, false, null, err.message));
        return;
      }

      if (type === 'STORE_SUBSCRIBE') {
        replyIframe(requestId, true, true);
        return;
      }
    }

    function replyIframe(
      requestId: string,
      success: boolean,
      data?: any,
      error?: string
    ) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'SDK_RESPONSE',
            requestId,
            success,
            data,
            error,
          },
          '*'
        );
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [appId, currentUser, app?.role]);

  function reloadIframe() {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  // Construct sandboxed embed URL (supports separate origin via NEXT_PUBLIC_SANDBOX_ORIGIN)
  const sandboxOrigin = (process.env.NEXT_PUBLIC_SANDBOX_ORIGIN || '').replace(
    /\/$/,
    ''
  );
  const embedSrc = `${sandboxOrigin}/embed/${appId}?userId=${encodeURIComponent(
    currentUser.id
  )}&email=${encodeURIComponent(currentUser.email)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">
            Initializing zero-trust sandbox...
          </p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-[var(--status-revoked-bg)] border border-[var(--status-revoked-border)] text-[var(--status-revoked-text)] flex items-center justify-center mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle>No Access to This Tool</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs">
              <div className="font-semibold text-[var(--text-secondary)] mb-1">
                Signed in as: {currentUser.name}
              </div>
              <div className="font-mono text-[11px] text-[var(--text-muted)]">
                {currentUser.email}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Switch test account to verify role permissions:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSwitchUser(user)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                      currentUser.id === user.id
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent)] font-semibold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="truncate">{user.name}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                      {user.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Link href="/login">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                Sign In with OAuth
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Return to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: App Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors focus-ring"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {app.title}
            </h1>
            <Badge
              variant={
                app.role === 'owner'
                  ? 'accent'
                  : app.role === 'editor'
                  ? 'active'
                  : 'restricted'
              }
            >
              {app.role === 'owner'
                ? 'Owner'
                : app.role === 'editor'
                ? 'Editor'
                : app.role === 'viewer'
                ? 'Viewer (Read-only)'
                : 'Link Viewer (Read-only)'}
            </Badge>
          </div>
        </div>

        {/* Center: Live Realtime & Sandbox Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-default)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Isolated Sandbox</span>
          <span className="text-[var(--text-faint)]">•</span>
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'syncing'
                ? 'bg-[var(--status-restricted-dot)] animate-ping'
                : syncStatus === 'readonly'
                ? 'bg-[var(--status-restricted-dot)]'
                : 'bg-[var(--status-active-dot)]'
            }`}
          />
          <span>
            {syncStatus === 'syncing'
              ? 'Syncing state...'
              : syncStatus === 'readonly'
              ? 'Read-Only Mode'
              : 'Realtime Sync Active'}
          </span>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Switch Active Test Account */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus-ring cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="truncate max-w-[110px] font-medium">
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-1.5 shadow-xl z-30">
                <div className="text-[10px] font-bold text-[var(--text-muted)] px-2.5 py-1 uppercase tracking-wider">
                  Test Multi-User Role
                </div>
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSwitchUser(user)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      currentUser.id === user.id
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{user.name}</span>
                    <span className="text-[10px] font-mono opacity-75">
                      {user.email.split('@')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={reloadIframe}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border-default)] transition-colors focus-ring cursor-pointer"
            title="Reload Sandboxed App"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {(app.role === 'owner' || app.role === 'editor') && (
            <Link href={`/studio/${app.id}`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                }
              >
                Studio
              </Button>
            </Link>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share
          </Button>
        </div>
      </header>

      {/* Read-Only Permission Denied Banner when Viewer attempts to write */}
      {permissionNotice && (
        <div className="px-4 py-2 bg-[var(--status-restricted-bg)] border-b border-[var(--status-restricted-border)] text-[var(--status-restricted-text)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{permissionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPermissionNotice(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sandboxed App Container */}
      <main className="flex-1 w-full bg-[var(--bg-canvas)] relative">
        <iframe
          ref={iframeRef}
          src={embedSrc}
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

export default function HostedAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-[var(--text-muted)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading tool...</p>
          </div>
        </div>
      }
    >
      <HostedAppContent params={params} />
    </Suspense>
  );
}
