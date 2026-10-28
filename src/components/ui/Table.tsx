import React from "react";

export function Table({ children, className = "", "data-testid": testId }: { children: React.ReactNode; className?: string; "data-testid"?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border-default)]">
      <table data-testid={testId} className={`w-full text-left text-sm border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <thead className={`bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-default)] ${className}`}>{children}</thead>;
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)] ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-100 hover:bg-[var(--bg-subtle)] ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`h-10 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] ${className}`}>{children}</th>;
}

export function TableCell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`p-4 text-[var(--text-primary)] align-middle ${className}`}>{children}</td>;
}
