"use client";

import React, { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

export interface CopyFieldProps {
  value: string;
  label?: string;
  isSecret?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function CopyField({
  value,
  label,
  isSecret = false,
  className = "",
  "data-testid": testId,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(!isSecret);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-[var(--text-secondary)] select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <input
          type={showSecret ? "text" : "password"}
          readOnly
          value={value}
          data-testid={testId}
          className="w-full h-9 pl-3 pr-20 font-mono text-xs rounded-md bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] select-all focus-ring"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          {isSecret && (
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] focus-ring cursor-pointer"
              aria-label={showSecret ? "Hide secret" : "Show secret"}
            >
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer focus-ring ${
              copied
                ? "bg-[var(--status-active-bg)] text-[var(--status-active-text)]"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)]"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--status-active-text)]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
