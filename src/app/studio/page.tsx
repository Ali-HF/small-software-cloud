'use client';

// ==============================================================================
// Small Software Cloud - Create New App Studio (/studio)
// Prompt -> Claude -> Live Preview -> Save to Cloud
// ==============================================================================

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_USERS } from '@/lib/storage';
import { injectSDKIntoHtml } from '@/lib/sdk-script';
import { 
  ArrowLeft, 
  Sparkles, 
  Send, 
  Save, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Code,
  CheckCircle2,
  Wand2
} from 'lucide-react';

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';

  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('New Tool');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentUser = MOCK_USERS[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-generate if query param prompt was passed
  useEffect(() => {
    if (initialPrompt && !generatedHtml && !isGenerating) {
      handleGenerate(initialPrompt);
    }
  }, [initialPrompt]);

  // Update iframe with injected SDK
  useEffect(() => {
    if (iframeRef.current && generatedHtml) {
      const htmlWithSdk = injectSDKIntoHtml(generatedHtml);
      iframeRef.current.srcdoc = htmlWithSdk;
    }
  }, [generatedHtml]);

  async function handleGenerate(promptText: string) {
    if (!promptText.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatusMessage('Generating single-file HTML app with Claude 3.5 Sonnet...');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedHtml(data.html);
      setGeneratedTitle(data.title || 'Custom Cloud Tool');
      setStatusMessage('Tool generated! You can test it live in the preview below.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveApp() {
    if (!generatedHtml || isSaving) return;
    setIsSaving(true);
    setStatusMessage('Saving app to Small Software Cloud...');

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedTitle,
          prompt,
          html: generatedHtml,
          ownerId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save app');

      router.push(`/studio/${data.app.id}`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate max-w-xs">{generatedTitle}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                New Creation
              </span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        {generatedHtml && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('preview'); setViewMode('desktop'); }}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'preview' && viewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setActiveTab('preview'); setViewMode('tablet'); }}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'preview' && viewMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setActiveTab('preview'); setViewMode('mobile'); }}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'preview' && viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-800 mx-1" />
            <button
              onClick={() => setActiveTab(activeTab === 'code' ? 'preview' : 'code')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Save button */}
        <div>
          {generatedHtml && (
            <button
              onClick={handleSaveApp}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save App'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
        
        {/* Status Toast */}
        {statusMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-xs text-indigo-300 backdrop-blur-md shadow-xl flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* If no HTML yet, show the full creation prompt hero */}
        {!generatedHtml ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6">
              <Wand2 className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-3 text-slate-100">
              What small software do you want to build?
            </h2>
            <p className="text-sm text-slate-400 text-center max-w-md mb-8">
              Describe your tool in plain English. We will generate it as a self-contained HTML app with live shared storage.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleGenerate(prompt); }}
              className="w-full relative mb-6"
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A shared grocery list for my family with category tabs, strikethrough checkboxes, and real-time multiplayer sync..."
                rows={4}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xl resize-none"
                required
              />

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-slate-500">
                  Powered by Claude 3.5 Sonnet + window.cloud SDK
                </span>
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : 'Generate App'}</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="w-full">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Or try an example
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Flatmate Expense Splitter with net balances',
                  'Live Team Architecture Decision Poll',
                  'Weekly Team Standup & Habit Roster',
                  'Pomodoro Focus Timer with shared team room',
                  'Classroom Attendance Sheet with export'
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => { setPrompt(sample); handleGenerate(sample); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Preview & Code View */
          <div className="flex-1 flex flex-col p-4 overflow-auto items-center justify-center">
            {activeTab === 'preview' ? (
              <div
                className={`h-full transition-all duration-300 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${
                  viewMode === 'desktop' ? 'w-full' : viewMode === 'tablet' ? 'w-[768px]' : 'w-[375px]'
                }`}
              >
                <div className="h-7 bg-slate-950 border-b border-slate-800/80 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">live interactive preview</span>
                  <div className="w-8" />
                </div>
                <iframe
                  ref={iframeRef}
                  sandbox="allow-scripts"
                  title="Live Preview"
                  className="flex-1 w-full border-0 bg-transparent"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 p-4 font-mono text-xs overflow-auto text-slate-300 select-all">
                <pre>{generatedHtml}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Studio...
      </div>
    }>
      <StudioCreateContent />
    </Suspense>
  );
}
