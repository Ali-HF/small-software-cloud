import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Card({ children, className = "", "data-testid": testId, ...props }: CardProps) {
  return (
    <div
      data-testid={testId}
      className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 border-b border-[var(--border-subtle)] flex flex-col gap-1 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-base font-semibold text-[var(--text-primary)] tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-[var(--text-muted)] leading-relaxed ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] rounded-b-xl flex items-center justify-between ${className}`}>{children}</div>;
}
