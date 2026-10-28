import React from "react";

export interface BadgeProps {
  variant?: "active" | "restricted" | "expired" | "revoked" | "default" | "accent";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className = "",
  "data-testid": testId,
}: BadgeProps) {
  const variantStyles = {
    active:
      "bg-[var(--status-active-bg)] text-[var(--status-active-text)] border-[var(--status-active-border)]",
    restricted:
      "bg-[var(--status-restricted-bg)] text-[var(--status-restricted-text)] border-[var(--status-restricted-border)]",
    expired:
      "bg-[var(--status-expired-bg)] text-[var(--status-expired-text)] border-[var(--status-expired-border)]",
    revoked:
      "bg-[var(--status-revoked-bg)] text-[var(--status-revoked-text)] border-[var(--status-revoked-border)]",
    default:
      "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]",
    accent:
      "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]",
  };

  const dotColors = {
    active: "bg-[var(--status-active-text)]",
    restricted: "bg-[var(--status-restricted-text)]",
    expired: "bg-[var(--status-expired-text)]",
    revoked: "bg-[var(--status-revoked-text)]",
    default: "bg-[var(--text-muted)]",
    accent: "bg-[var(--accent)]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
  };

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center font-medium rounded-full border tracking-tight select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
