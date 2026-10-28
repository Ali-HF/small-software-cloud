"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_USERS } from "@/lib/storage";
import { injectSDKIntoHtml } from "@/lib/sdk-script";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Wand2,
  Sun,
  Moon,
  Shield,
} from "lucide-react";
import { Button, Badge, useTheme } from "@/components/ui";

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>("New Tool");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentUser = MOCK_USERS[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (initialPrompt && !generatedHtml && !isGenerating) {
      handleGenerate(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (iframeRef.current && generatedHtml) {
      const htmlWithSdk = injectSDKIntoHtml(generatedHtml);
      iframeRef.current.srcdoc = htmlWithSdk;
    }
  }, [generatedHtml]);

  async function handleGenerate(promptText: string) {
    if (!promptText.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatusMessage("Generating tool with single-file HTML & live shared store...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGeneratedHtml(data.html);
      setGeneratedTitle(data.title || "Custom Cloud Tool");
      setStatusMessage("Tool generated! You can test it live in the preview below.");
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
    setStatusMessage("Saving tool to Small Software Cloud...");

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedTitle,
          prompt,
          html: generatedHtml,
          ownerId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tool");

      router.push(`/studio/${data.app.id}`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors focus-ring"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-xs">{generatedTitle}</h1>
            <Badge variant="accent">Prompt Builder</Badge>
          </div>
        </div>

        {/* View mode toggle */}
        {generatedHtml && (
          <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg border border-[var(--border-default)]">
            <button
              onClick={() => { setActiveTab("preview"); setViewMode("desktop"); }}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === "preview" && viewMode === "desktop"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
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
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

          {generatedHtml && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveApp}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save App
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] overflow-hidden relative">
        {/* Status Toast */}
        {statusMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--accent-border)] text-xs text-[var(--text-primary)] shadow-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {!generatedHtml ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center mb-5">
              <Wand2 className="w-5 h-5" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 tracking-tight">
              Build a micro-app from a prompt
            </h2>
            <p className="text-xs text-[var(--text-muted)] text-center max-w-md mb-6 leading-relaxed">
              Describe your tool in plain English. It will be generated as a self-contained HTML app with live shared multi-user storage.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleGenerate(prompt); }}
              className="w-full relative mb-6"
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A shared grocery list for my team with category tabs, strikethrough checkboxes, and real-time sync..."
                rows={4}
                className="w-full p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus-ring resize-none shadow-xs"
                required
              />

              <div className="flex justify-between items-center mt-3">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  window.cloud SDK injected
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isGenerating}
                  disabled={!prompt.trim()}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Generate App
                </Button>
              </div>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="w-full">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5 text-center">
                Example prompts
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Flatmate Expense Splitter with net balances",
                  "Live Team Architecture Decision Poll",
                  "Weekly Team Standup & Habit Roster",
                  "Classroom Attendance Sheet with export",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => { setPrompt(sample); handleGenerate(sample); }}
                    className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">live sandboxed preview</span>
                  <div className="w-6" />
                </div>
                <iframe
                  ref={iframeRef}
                  sandbox="allow-scripts"
                  title="Live Preview"
                  className="flex-1 w-full border-0 bg-transparent"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-4 font-mono text-xs overflow-auto text-[var(--text-primary)] select-all">
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
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-xs text-[var(--text-muted)] font-medium">
        Loading Studio...
      </div>
    }>
      <StudioCreateContent />
    </Suspense>
  );
}
