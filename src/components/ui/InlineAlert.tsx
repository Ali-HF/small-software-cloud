import React from "react";
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export interface InlineAlertProps {
  variant?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function InlineAlert({
  variant = "info",
  title,
  children,
  className = "",
  "data-testid": testId,
}: InlineAlertProps) {
  const styles = {
    info: {
      container: "bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--text-primary)]",
      icon: <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />,
      titleColor: "text-[var(--text-primary)]",
    },
    warning: {
      container: "bg-[var(--status-restricted-bg)] border-[var(--status-restricted-border)] text-[var(--text-primary)]",
      icon: <AlertTriangle className="w-4 h-4 text-[var(--status-restricted-text)] shrink-0 mt-0.5" />,
      titleColor: "text-[var(--status-restricted-text)]",
    },
    error: {
      container: "bg-[var(--status-revoked-bg)] border-[var(--status-revoked-border)] text-[var(--text-primary)]",
      icon: <AlertCircle className="w-4 h-4 text-[var(--status-revoked-text)] shrink-0 mt-0.5" />,
      titleColor: "text-[var(--status-revoked-text)]",
    },
    success: {
      container: "bg-[var(--status-active-bg)] border-[var(--status-active-border)] text-[var(--text-primary)]",
      icon: <CheckCircle2 className="w-4 h-4 text-[var(--status-active-text)] shrink-0 mt-0.5" />,
      titleColor: "text-[var(--status-active-text)]",
    },
  };

  const current = styles[variant];

  return (
    <div
      data-testid={testId}
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs leading-relaxed ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex flex-col gap-0.5">
        {title && <span className={`font-semibold ${current.titleColor}`}>{title}</span>}
        <div className="text-[var(--text-secondary)]">{children}</div>
      </div>
    </div>
  );
}
