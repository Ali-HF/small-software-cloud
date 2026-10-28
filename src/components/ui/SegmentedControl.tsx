import React from "react";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  size?: "sm" | "md";
  className?: string;
  "data-testid"?: string;
}

export function SegmentedControl({
  value,
  onChange,
  options,
  size = "md",
  className = "",
  "data-testid": testId,
}: SegmentedControlProps) {
  const heightClass = size === "sm" ? "h-7 text-xs p-0.5" : "h-9 text-sm p-1";

  return (
    <div
      role="radiogroup"
      data-testid={testId}
      className={`inline-flex rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] select-none ${heightClass} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 font-medium rounded-md transition-all duration-150 cursor-pointer focus-ring ${
              isSelected
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {opt.icon && <span className="opacity-80">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
