'use client';

// ==============================================================================
// Small Software Cloud - Landing Page (YE Digital Hackathon 2026)
// ==============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Cloud, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Code2, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/studio?prompt=${encodeURIComponent(prompt.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Small Software Cloud
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/studio"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Studio</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 sm:px-12 max-w-5xl mx-auto w-full text-center">
        
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>YE Digital Hackathon 2026 \u2022 Cloud for Small Software</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
          The cloud for software <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-purple-400">
            too small to build, but too useful to skip.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Describe any small tool in plain English. The platform generates it as a single-file HTML app, stores it, and serves it with an injected SDK for shared realtime persistence.
        </p>

        {/* Prompt Input Bar */}
        <form onSubmit={handleCreate} className="max-w-2xl mx-auto relative mb-12">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl focus-within:border-indigo-500/80 transition-all">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A shared expense splitter for my flat with net balances..."
              className="w-full px-4 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
            >
              <span>Build Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Demo App Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 font-semibold mr-1">Pre-built Demos:</span>
          <Link
            href="/a/app-expense-demo"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            🏡 <span>Expense Splitter</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
          <Link
            href="/a/app-poll-demo"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            📊 <span>Live Decision Poll</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
          <Link
            href="/a/app-roster-demo"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            📋 <span>Team Habit Roster</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>
        </div>
      </section>

      {/* 3 Featured Demo Apps Showcase */}
      <section className="py-16 px-6 sm:px-12 max-w-6xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-2">
            Explore Ready-to-Use Demo Apps
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            These full single-file micro applications are powered by the platform&apos;s injected SDK and realtime storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                🏡
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors mb-2">
                Flatmate Expense Splitter
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Realtime expense logging for flatmates with automatic net balance calculation, who owes whom, and live multiplayer synchronization.
              </p>
            </div>
            <Link
              href="/a/app-expense-demo"
              className="mt-4 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>Launch Demo App</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
                📊
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors mb-2">
                Live Decision Poll
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Multi-option team voting with animated percentage bars, individual voter tracking, and instant updates across all active participants.
              </p>
            </div>
            <Link
              href="/a/app-poll-demo"
              className="mt-4 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>Launch Demo App</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                📋
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2">
                Team Habit & Task Roster
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Interactive Mon-Fri schedule table for recurring standups, deployment rotations, and team streaks with live checkbox synchronization.
              </p>
            </div>
            <Link
              href="/a/app-roster-demo"
              className="mt-4 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>Launch Demo App</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture & Security Highlights */}
      <section className="py-16 px-6 sm:px-12 max-w-6xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-2">
            Engineered with Zero-Trust Security
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Untrusted generated code never touches user session tokens, parent cookies, or database credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Sandboxed iframe</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict <code>sandbox=&quot;allow-scripts&quot;</code> without <code>allow-same-origin</code> guarantees complete process and cookie isolation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Injected SDK Bridge</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code>window.cloud.store</code> communicates over postMessage. Host enforces granular permissions on every write.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Google-Docs Sharing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Invite collaborators by email as Viewer or Editor, or toggle public link access with one click.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Version History</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every chat-style iteration creates a tracked version. Preview and restore previous iterations with one click.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 sm:px-12 text-center text-xs text-slate-500">
        <p>Small Software Cloud \u2022 YE Digital Hackathon 2026 \u2022 Built with Next.js, Supabase, and Claude 3.5 Sonnet</p>
      </footer>
    </div>
  );
}
