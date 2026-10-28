import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  "data-testid"?: string;
}

export function Skeleton({ className = "", "data-testid": testId, ...props }: SkeletonProps) {
  return (
    <div
      data-testid={testId}
      className={`animate-pulse rounded-md bg-[var(--border-default)] ${className}`}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <Skeleton className="h-9 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md opacity-60" />
      ))}
    </div>
  );
}
