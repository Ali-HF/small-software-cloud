'use client';

// ==============================================================================
// Small Software Cloud - Studio Iteration & Preview (/studio/[id])
// Features Live Preview, Chat-Style "Change It" Box, and Version History with Restore
// ==============================================================================

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { App, AppVersion, User } from '@/types';
import { MOCK_USERS } from '@/lib/storage';
import ShareModal from '@/components/ShareModal';
import { injectSDKIntoHtml } from '@/lib/sdk-script';
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  History, 
  Share2, 
  ExternalLink, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Code, 
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Suspense } from 'react';

function StudioContent({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params);
  const appId = resolvedParams.id;

  const [app, setApp] = useState<App | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [isIterating, setIsIterating] = useState<boolean>(false);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentUser = MOCK_USERS[0]; // Alice (Owner)
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchAppAndVersions();
  }, [appId]);

  async function fetchAppAndVersions() {
    try {
      const appRes = await fetch(`/api/apps/${appId}?userId=${currentUser.id}`);
      const appData = await appRes.json();
      if (appData.app) {
        setApp(appData.app);
        if (appData.app.current_version) {
          setCurrentHtml(appData.app.current_version.html);
        }
      }

      const verRes = await fetch(`/api/apps/${appId}/versions`);
      const verData = await verRes.json();
      if (verData.versions) {
        setVersions(verData.versions);
      }
    } catch (err) {
      console.error('Error fetching studio data:', err);
    }
  }

  // Update iframe with injected SDK whenever currentHtml changes
  useEffect(() => {
    if (iframeRef.current && currentHtml) {
      const htmlWithSdk = injectSDKIntoHtml(currentHtml);
      iframeRef.current.srcdoc = htmlWithSdk;
    }
  }, [currentHtml]);

  // Handle Iteration: Chat-style "Change It" Box
  async function handleIterate(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || isIterating) return;

    setIsIterating(true);
    setStatusMessage('Asking Claude to update your tool...');

    try {
      const res = await fetch('/api/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHtml,
          instruction: instruction.trim(),
          appId,
          userId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Iteration failed');

      setCurrentHtml(data.html);
      setInstruction('');
      setStatusMessage('Tool updated successfully! New version created.');
      setTimeout(() => setStatusMessage(null), 3000);

      // Refresh version history
      fetchAppAndVersions();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsIterating(false);
    }
  }

  // Handle Version Restore
  async function handleRestoreVersion(version: AppVersion) {
    try {
      setStatusMessage(`Restoring version from ${new Date(version.created_at).toLocaleTimeString()}...`);
      const res = await fetch(`/api/apps/${appId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          versionId: version.id,
          userId: currentUser.id
        })
      });

      if (!res.ok) throw new Error('Failed to restore version');
      setCurrentHtml(version.html);
      setStatusMessage('Version restored successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
      fetchAppAndVersions();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
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
              <h1 className="text-sm font-bold truncate max-w-xs">{app?.title || 'Tool Studio'}</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device & View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('preview'); setViewMode('desktop'); }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'preview' && viewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('preview'); setViewMode('tablet'); }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'preview' && viewMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('preview'); setViewMode('mobile'); }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'preview' && viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          <button
            onClick={() => setActiveTab(activeTab === 'code' ? 'preview' : 'code')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Inspect HTML Source"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isHistoryOpen 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({versions.length})</span>
          </button>

          {app && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          <Link
            href={`/a/${appId}`}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Live App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left/Center: Preview or Code View */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Status Toast */}
          {statusMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-xs text-indigo-300 backdrop-blur-md shadow-xl flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
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
                  <span className="text-[10px] text-slate-500 font-mono">sandboxed preview (allow-scripts)</span>
                  <div className="w-8" />
                </div>
                <iframe
                  ref={iframeRef}
                  sandbox="allow-scripts"
                  title="Studio Live Preview"
                  className="flex-1 w-full border-0 bg-transparent"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 p-4 font-mono text-xs overflow-auto text-slate-300 select-all">
                <pre>{currentHtml}</pre>
              </div>
            )}
          </div>

          {/* Bottom Chat-Style "Change It" Box */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md shrink-0">
            <form onSubmit={handleIterate} className="max-w-4xl mx-auto flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Ask Claude to change it... (e.g., 'Add a category filter', 'Make the background darker', 'Add CSV export')"
                  disabled={isIterating}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isIterating || !instruction.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
              >
                {isIterating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>Modifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Change It</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Drawer: Version History */}
        {isHistoryOpen && (
          <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Version History
              </h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {versions.map((ver, idx) => {
                const isCurrent = app?.current_version_id === ver.id;
                return (
                  <div
                    key={ver.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-200">Version {versions.length - idx}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 font-medium">
                      &quot;{ver.prompt}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {isCurrent ? (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Current
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRestoreVersion(ver)}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore this version
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && app && (
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

export default function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading Studio...</p>
        </div>
      </div>
    }>
      <StudioContent params={params} />
    </Suspense>
  );
}

