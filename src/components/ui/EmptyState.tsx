import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  "data-testid": testId,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[var(--border-strong)] rounded-xl bg-[var(--bg-surface)] ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
