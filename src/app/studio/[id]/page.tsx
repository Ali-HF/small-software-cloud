"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import Link from "next/link";
import { App, AppVersion, User } from "@/types";
import { MOCK_USERS, getStoredMockUser } from "@/lib/storage";
import ShareModal from "@/components/ShareModal";
import { injectSDKIntoHtml } from "@/lib/sdk-script";
import {
  ArrowLeft,
  Sparkles,
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
  Sun,
  Moon,
  X,
} from "lucide-react";
import { Button, Badge, Drawer, useTheme } from "@/components/ui";

function StudioContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const appId = resolvedParams.id;
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [app, setApp] = useState<App | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [instruction, setInstruction] = useState<string>("");
  const [isIterating, setIsIterating] = useState<boolean>(false);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredMockUser());
  }, []);

  useEffect(() => {
    fetchAppAndVersions();
  }, [appId, currentUser.id]);

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
      console.error("Error fetching studio data:", err);
    }
  }

  useEffect(() => {
    if (iframeRef.current && currentHtml) {
      const htmlWithSdk = injectSDKIntoHtml(currentHtml);
      iframeRef.current.srcdoc = htmlWithSdk;
    }
  }, [currentHtml]);

  async function handleIterate(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || isIterating) return;

    setIsIterating(true);
    setStatusMessage("Applying modifications...");

    try {
      const res = await fetch("/api/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          currentHtml,
          instruction: instruction.trim(),
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Iteration failed");

      setCurrentHtml(data.html);
      setInstruction("");
      setStatusMessage("Modification applied!");
      setTimeout(() => setStatusMessage(null), 2500);
      fetchAppAndVersions();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsIterating(false);
    }
  }

  async function handleRestoreVersion(version: AppVersion) {
    try {
      setStatusMessage(`Restoring version from ${new Date(version.created_at).toLocaleTimeString()}...`);
      const res = await fetch(`/api/apps/${appId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          versionId: version.id,
          userId: currentUser.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to restore version");
      setCurrentHtml(version.html);
      setStatusMessage("Version restored successfully!");
      setTimeout(() => setStatusMessage(null), 2500);
      fetchAppAndVersions();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors focus-ring"
            title="All Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-xs">{app?.title || "Tool Studio"}</h1>
            <Badge variant="accent">v{versions.length || 1}</Badge>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg border border-[var(--border-default)]">
          <button
            onClick={() => { setActiveTab("preview"); setViewMode("desktop"); }}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              activeTab === "preview" && viewMode === "desktop"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setActiveTab("preview"); setViewMode("tablet"); }}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              activeTab === "preview" && viewMode === "tablet"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setActiveTab("preview"); setViewMode("mobile"); }}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              activeTab === "preview" && viewMode === "mobile"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-[var(--border-default)] mx-0.5" />
          <button
            onClick={() => setActiveTab(activeTab === "code" ? "preview" : "code")}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              activeTab === "code"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            title="Inspect HTML"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            leftIcon={<History className="w-3.5 h-3.5" />}
          >
            History ({versions.length})
          </Button>

          {app && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsShareModalOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share
            </Button>
          )}

          <Link href={`/a/${appId}`} target="_blank">
            <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Open Live
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] relative overflow-hidden">
          {statusMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--accent-border)] text-xs text-[var(--text-primary)] shadow-md flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {activeTab === "preview" ? (
              <div
                className={`h-full transition-all duration-200 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-lg overflow-hidden flex flex-col ${
                  viewMode === "desktop" ? "w-full" : viewMode === "tablet" ? "w-[768px]" : "w-[375px]"
                }`}
              >
                <div className="h-7 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-revoked-text)] opacity-60" />
                    <div className="w-2 h-2 rounded-full bg-[var(--status-restricted-text)] opacity-60" />
                    <div className="w-2 h-2 rounded-full bg-[var(--status-active-text)] opacity-60" />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">sandboxed live preview</span>
                  <div className="w-6" />
                </div>
                <iframe
                  ref={iframeRef}
                  sandbox="allow-scripts"
                  title="Studio Live Preview"
                  className="flex-1 w-full border-0 bg-transparent"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 font-mono text-xs overflow-auto text-[var(--text-primary)] select-all">
                <pre>{currentHtml}</pre>
              </div>
            )}
          </div>

          {/* Bottom Chat-Style "Change It" Box */}
          <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-default)] shrink-0">
            <form onSubmit={handleIterate} className="max-w-3xl mx-auto flex items-center gap-2.5">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Ask to change it... (e.g. 'Add a filter by category', 'Make cards dark', 'Add CSV export')"
                disabled={isIterating}
                className="flex-1 h-9 px-3 text-sm rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus-ring"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isIterating || !instruction.trim()}
                isLoading={isIterating}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Change It
              </Button>
            </form>
          </div>
        </div>

        {/* Slide-over Version History */}
        <Drawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title="Version History"
          description={`All saved iterations for ${app?.title || "this tool"}`}
        >
          <div className="flex flex-col gap-2.5">
            {versions.map((ver, idx) => {
              const isCurrent = app?.current_version_id === ver.id;
              return (
                <div
                  key={ver.id}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    isCurrent
                      ? "bg-[var(--accent-subtle)] border-[var(--accent-border)]"
                      : "bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--text-primary)]">Version {versions.length - idx}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {new Date(ver.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mb-2 font-normal">
                    &quot;{ver.prompt}&quot;
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    {isCurrent ? (
                      <span className="text-[10px] font-semibold text-[var(--status-active-text)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Current active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRestoreVersion(ver)}
                        className="text-[11px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
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
        </Drawer>
      </div>

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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-xs text-[var(--text-muted)]">
          Loading Studio...
        </div>
      }
    >
      <StudioContent params={params} />
    </Suspense>
  );
}
