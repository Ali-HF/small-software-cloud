'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Lock,
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
import {
  hasSupabase,
  signInWithOAuthProvider,
  getSupabaseSessionUser,
} from '@/lib/supabase';
import {
  MOCK_USERS,
  getStoredMockUser,
  setStoredMockUser,
} from '@/lib/storage';
import { User } from '@/types';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';
  const { resolvedTheme, setTheme } = useTheme();

  const [isLoadingProvider, setIsLoadingProvider] = useState<
    'google' | 'github' | null
  >(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<User>(MOCK_USERS[0]);
  const liveSupabase = hasSupabase();

  useEffect(() => {
    setActiveUser(getStoredMockUser());
    if (liveSupabase) {
      getSupabaseSessionUser().then((u) => {
        if (u) setActiveUser(u);
      });
    }
  }, [liveSupabase]);

  async function handleOAuth(provider: 'google' | 'github') {
    setIsLoadingProvider(provider);
    setAuthNotice(null);
    try {
      const res = await signInWithOAuthProvider(provider, nextUrl);
      if (res.error) {
        setAuthNotice(res.error);
      } else if (res.url) {
        window.location.href = res.url;
        return;
      }
    } catch (err: any) {
      setAuthNotice(err.message || 'Authentication failed');
    } finally {
      setIsLoadingProvider(null);
    }
  }

  function handleSelectDevAccount(user: User) {
    setStoredMockUser(user);
    setActiveUser(user);
    router.push(nextUrl);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border-default)] px-6 sm:px-12 flex items-center justify-between bg-[var(--bg-surface)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Small Software Cloud
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Dashboard
          </Link>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <Badge variant={liveSupabase ? 'active' : 'accent'} dot>
                  {liveSupabase ? 'Supabase Auth Live' : 'Hybrid OAuth + Dev Mode'}
                </Badge>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  OAuth 2.0
                </span>
              </div>
              <CardTitle>Sign in to Small Software Cloud</CardTitle>
              <CardDescription>
                Authenticate with Google or GitHub to create, host, and collaborate on shared micro-tools. No passwords stored.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {authNotice && (
                <InlineAlert variant="info" title="Dev Mode Active">
                  {authNotice}
                </InlineAlert>
              )}

              {/* OAuth Providers (Google & GitHub only per prompt.md) */}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={isLoadingProvider === 'google'}
                  onClick={() => handleOAuth('google')}
                  leftIcon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.64 5 12c0-3.64 3.36-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                      />
                    </svg>
                  }
                >
                  Continue with Google
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={isLoadingProvider === 'github'}
                  onClick={() => handleOAuth('github')}
                  leftIcon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  }
                >
                  Continue with GitHub
                </Button>
              </div>

              {/* Instant Test Account Switcher for Multi-Account Testing */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Instant Multi-User Test Accounts
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    1-click switch
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {MOCK_USERS.map((user) => {
                    const isSelected = activeUser.id === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectDevAccount(user)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer focus-ring ${
                          isSelected
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {user.name}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <Badge variant="active">Current</Badge>
                          )}
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--status-active-text)]" />
                Invited emails match automatically on sign-in
              </span>
              <Link
                href={nextUrl}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Skip to Dashboard
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-xs text-[var(--text-muted)]">
          Loading sign-in...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

