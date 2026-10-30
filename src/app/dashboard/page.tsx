'use client';

// ==============================================================================
// Small Software Cloud - Dashboard (/dashboard)
// Tabs: "My Apps" and "Shared With Me", with Rename, Duplicate, Delete & Share
// Styled with Design System Tokens & Component Kit
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { App, User } from '@/types';
import {
  MOCK_USERS,
  getStoredMockUser,
  setStoredMockUser,
} from '@/lib/storage';
import { getSupabaseSessionUser, hasSupabase } from '@/lib/supabase';
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
  Shield,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  Modal,
  Input,
  EmptyState,
  Skeleton,
  SegmentedControl,
  useTheme,
} from '@/components/ui';

export default function DashboardPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [tab, setTab] = useState<'my' | 'shared'>('my');
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [activeMenuAppId, setActiveMenuAppId] = useState<string | null>(null);
  const [sharingApp, setSharingApp] = useState<App | null>(null);
  const [renamingApp, setRenamingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
    fetchApps();
  }, [tab, currentUser]);

  async function fetchApps() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/apps?tab=${tab}&userId=${encodeURIComponent(
          currentUser.id
        )}&email=${encodeURIComponent(currentUser.email)}`
      );
      const data = await res.json();
      if (data.apps) setApps(data.apps);
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSwitchUser(user: User) {
    setStoredMockUser(user);
    setCurrentUser(user);
    setIsAccountMenuOpen(false);
  }

  async function handleDuplicate(appId: string) {
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', userId: currentUser.id }),
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

  async function handleConfirmDelete() {
    if (!deletingApp) return;
    try {
      await fetch(
        `/api/apps/${deletingApp.id}?userId=${encodeURIComponent(
          currentUser.id
        )}`,
        {
          method: 'DELETE',
        }
      );
      setApps(apps.filter((a) => a.id !== deletingApp.id));
    } catch (err) {
      console.error('Error deleting app:', err);
    } finally {
      setDeletingApp(null);
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
        body: JSON.stringify({
          title: newTitle.trim(),
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.app) {
        setApps(
          apps.map((a) =>
            a.id === renamingApp.id ? { ...a, title: data.app.title } : a
          )
        );
      }
    } catch (err) {
      console.error('Error renaming app:', err);
    } finally {
      setRenamingApp(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 sm:px-10 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
              Small Software Cloud
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
            <Link
              href="/dashboard"
              className="text-[var(--text-primary)] font-semibold"
            >
              Dashboard
            </Link>
            <Link
              href="/studio"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Studio
            </Link>
            <Link
              href="/quickstart"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Share CLI
            </Link>
          </nav>
        </div>

        {/* Right Controls: User Role Switcher, Sign-in, Theme & Create */}
        <div className="flex items-center gap-2.5">
          {/* Account Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus-ring cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--status-active-dot)]" />
              <span className="hidden sm:inline text-[var(--text-muted)]">
                Account:
              </span>
              <span className="font-semibold truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-2 shadow-xl z-40">
                <div className="text-[10px] font-bold text-[var(--text-muted)] px-2.5 py-1 uppercase tracking-wider">
                  Switch Active Account
                </div>
                <div className="space-y-1 mt-1">
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSwitchUser(user)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.id === user.id
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold border border-[var(--accent-border)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {user.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">
                          {user.email}
                        </div>
                      </div>
                      {currentUser.id === user.id && (
                        <Badge variant="active">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <Link
                    href="/login"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-subtle)] flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google / GitHub OAuth Sign-In</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
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

          <Link href="/studio">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Tool
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-8">
        {/* Banner / Title & Segmented Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Your Small Software
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Single-file micro-apps with sandboxed execution, live multiplayer state, and Google-Docs-style sharing.
            </p>
          </div>

          <SegmentedControl
            value={tab}
            onChange={(val) => setTab(val as 'my' | 'shared')}
            options={[
              {
                value: 'my',
                label: 'My Apps',
                icon: <Layers className="w-3.5 h-3.5" />,
              },
              {
                value: 'shared',
                label: 'Shared With Me',
                icon: <Users className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        {/* App Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <CardContent className="pt-5 flex flex-col gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title={
              tab === 'my'
                ? 'No tools created by this account yet'
                : 'No tools shared with you yet'
            }
            description={
              tab === 'my'
                ? 'Describe any small tool in plain English and generate a self-contained collaborative app in seconds.'
                : `When a team member invites ${currentUser.email}, their shared tools will appear here.`
            }
            action={
              tab === 'my' ? (
                <Link href="/studio">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Your First Tool
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app) => (
              <Card
                key={app.id}
                className="group relative flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
              >
                <CardContent className="pt-5 flex flex-col justify-between h-full">
                  <div>
                    {/* Top badges & menu */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            app.role === 'owner'
                              ? 'accent'
                              : app.role === 'editor'
                              ? 'active'
                              : 'default'
                          }
                        >
                          {app.role === 'owner'
                            ? 'Owner'
                            : app.role === 'editor'
                            ? 'Editor'
                            : 'Viewer'}
                        </Badge>
                        {app.link_access === 'view' ? (
                          <Badge variant="active" dot>
                            Public Link
                          </Badge>
                        ) : (
                          <Badge variant="restricted" dot>
                            Restricted
                          </Badge>
                        )}
                      </div>

                      {/* Context Action Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuAppId(
                              activeMenuAppId === app.id ? null : app.id
                            )
                          }
                          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors focus-ring cursor-pointer"
                          aria-label="App actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuAppId === app.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-1.5 shadow-xl z-30">
                            {app.role === 'owner' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingApp(app);
                                  setNewTitle(app.title);
                                  setActiveMenuAppId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Rename</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDuplicate(app.id)}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSharingApp(app);
                                setActiveMenuAppId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share & Permissions</span>
                            </button>
                            {app.role === 'owner' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingApp(app);
                                  setActiveMenuAppId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--status-revoked-text)] hover:bg-[var(--status-revoked-bg)] flex items-center gap-2 cursor-pointer"
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
                    <Link href={`/a/${app.id}`} className="block">
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 mb-1">
                        {app.title}
                      </h3>
                    </Link>

                    {/* Prompt summary */}
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-5 leading-relaxed">
                      {app.current_version?.prompt ||
                        'Single-file cloud micro-application'}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {new Date(app.updated_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSharingApp(app)}
                        leftIcon={<Share2 className="w-3.5 h-3.5" />}
                      >
                        Share
                      </Button>

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

                      <Link href={`/a/${app.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Rename Dialog Modal */}
      <Modal
        isOpen={!!renamingApp}
        onClose={() => setRenamingApp(null)}
        title="Rename Tool"
        description="Update the display title for this shared application."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRenamingApp(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRenameSubmit as any}
            >
              Save Title
            </Button>
          </>
        }
      >
        <form onSubmit={handleRenameSubmit}>
          <Input
            label="Tool Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingApp}
        onClose={() => setDeletingApp(null)}
        title="Delete Tool"
        description={`Are you sure you want to permanently delete "${deletingApp?.title}"? All versions and shared KV data will be removed.`}
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingApp(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-xs text-[var(--text-secondary)]">
          Shared links to <code className="font-mono">/a/{deletingApp?.id}</code> will immediately stop working.
        </p>
      </Modal>

      {/* Share Modal */}
      {sharingApp && (
        <ShareModal
          app={sharingApp}
          currentUserId={currentUser.id}
          isOpen={!!sharingApp}
          onClose={() => setSharingApp(null)}
          onAppUpdated={(updated) => {
            setApps(apps.map((a) => (a.id === updated.id ? updated : a)));
            setSharingApp(updated);
          }}
        />
      )}
    </div>
  );
}
