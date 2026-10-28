"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Terminal,
  ArrowRight,
  Check,
  Copy,
  Folder,
  Globe,
  Lock,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CodeBlock,
  useTheme,
} from "@/components/ui";

export default function QuickstartPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--border-default)] px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-[var(--bg-canvas)]/90 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
            Small Software Cloud
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
          <Link
            href="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dev/components"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            Components
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Build from a prompt</span>
          </Link>

          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-12 py-12 flex flex-col gap-10 flex-1 w-full">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-semibold mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>Quickstart Guide</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Get started in 60 seconds
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xl">
            Protect any local codebase or deployed project with access-controlled links. No registration or credit card required.
          </p>
        </div>

        {/* Step 1 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="text-base font-bold tracking-tight">Run in your project directory</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] ml-8 leading-relaxed">
            Open your terminal, navigate to your project folder, and run the share command:
          </p>
          <div className="ml-8">
            <CodeBlock
              language="bash"
              title="Terminal"
              code="npx small-software-cloud share"
            />
          </div>
          <div className="ml-8 text-xs text-[var(--text-muted)] flex items-center gap-2">
            <span>Or if you cloned this repo:</span>
            <code className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-default)]">
              npm run share
            </code>
          </div>
        </section>

        {/* Step 2 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h2 className="text-base font-bold tracking-tight">What the terminal prints</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] ml-8 leading-relaxed">
            The CLI automatically detects your framework and starts an isolated local dashboard bound strictly to 127.0.0.1:
          </p>
          <div className="ml-8">
            <CodeBlock
              language="text"
              title="Terminal Output"
              code={`  Small Software Cloud: Share
  Project:   my-vite-app (Vite + React)
  Dashboard: http://localhost:4040  (127.0.0.1 only)

  Open this one-time sign-in link:
  http://localhost:4040/auth?t=8f49a21b3e70d44c9b...

  Press Ctrl+C to stop.`}
            />
          </div>
        </section>

        {/* Step 3 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center text-xs font-bold">
              3
            </span>
            <h2 className="text-base font-bold tracking-tight">What the dashboard displays</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] ml-8 leading-relaxed">
            Your browser opens automatically to the secure dashboard. Here is what you will see:
          </p>

          <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[var(--accent)]" />
                  <CardTitle>Project Overview</CardTitle>
                </div>
                <CardDescription>
                  Shows your detected framework, output directory, and git-ignore status.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[var(--text-secondary)] space-y-2">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Detected target:</span>
                  <span className="font-semibold">Static folder</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Output dir:</span>
                  <span className="font-mono">dist/</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-muted)]">Credentials:</span>
                  <span className="font-mono text-[11px]">~/.config (never in repo)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--status-active-text)]" />
                  <CardTitle>Access Link Creation</CardTitle>
                </div>
                <CardDescription>
                  Generate links for specific recipients with custom expiry and usage quotas.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[var(--text-secondary)] space-y-2">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Protection rules:</span>
                  <span className="font-semibold">PIN, Password, or Email</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Expiry options:</span>
                  <span className="font-semibold">1h, 24h, 7d, custom</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-muted)]">Audit trail:</span>
                  <span className="font-semibold">Real-time open & failed logs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Target Options */}
        <section className="flex flex-col gap-3 pt-4 border-t border-[var(--border-default)]">
          <h2 className="text-base font-bold tracking-tight">Three supported targets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--status-active-text)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Static folder
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Build files uploaded to private storage. Most secure since no public origin exists to leak.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Existing URL
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Already deployed on Vercel or Netlify. Gateway reverse-proxies to it with guided origin locking.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Local port
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Dev server runs locally and tunnels outbound while your machine remains active.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="p-6 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Ready to test?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Launch the local dashboard right now or explore the component kit.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dev/components">
              <Button size="sm">Component Kit</Button>
            </Link>
            <Link href="/">
              <Button size="sm" variant="primary">Back to Overview</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border-default)] py-8 px-6 sm:px-12 bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Small Software Cloud — Access-Controlled Share Links</span>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[var(--text-primary)]">Overview</Link>
            <Link href="/dev/components" className="hover:text-[var(--text-primary)]">Components</Link>
            <Link href="/studio" className="hover:text-[var(--text-primary)]">Studio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
