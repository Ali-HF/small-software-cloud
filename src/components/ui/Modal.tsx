"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  "data-testid": testId,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid={testId}>
      <div className="min-h-full flex items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          role="dialog"
          aria-modal="true"
          className={`relative w-full ${widthClasses[maxWidth]} bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl text-left overflow-hidden transform transition-all duration-200`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] focus-ring transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
