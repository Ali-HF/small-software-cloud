"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  "data-testid"?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  title,
  className = "",
  "data-testid": testId,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid={testId}
      className={`rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] overflow-hidden text-xs ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <span className="font-mono text-[11px] font-medium text-[var(--text-muted)] select-none">
          {title || language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer focus-ring px-1.5 py-0.5 rounded"
          aria-label="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[var(--status-active-text)]" />
              <span className="text-[var(--status-active-text)]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-xs text-[var(--text-primary)] leading-normal">
        <code>{code}</code>
      </pre>
    </div>
  );
}
