import React, { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  "data-testid"?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, disabled, className = "", id, "data-testid": testId, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[var(--text-secondary)] select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            data-testid={testId}
            className={`w-full h-9 pl-3 pr-8 text-sm rounded-md appearance-none transition-colors duration-150 bg-[var(--bg-surface)] text-[var(--text-primary)] border focus-ring disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed ${
              error
                ? "border-[var(--status-revoked-text)]"
                : "border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--border-focus)]"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-[var(--text-muted)]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-[var(--status-revoked-text)] mt-0.5">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
