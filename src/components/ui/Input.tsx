import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  mono?: boolean;
  "data-testid"?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightElement,
      mono = false,
      disabled = false,
      className = "",
      id,
      "data-testid": testId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--text-secondary)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            data-testid={testId}
            className={`w-full h-9 px-3 text-sm rounded-md transition-colors duration-150 bg-[var(--bg-surface)] text-[var(--text-primary)] border placeholder:text-[var(--text-faint)] focus-ring disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed ${
              leftIcon ? "pl-9" : ""
            } ${rightElement ? "pr-10" : ""} ${
              mono ? "font-mono text-xs" : ""
            } ${
              error
                ? "border-[var(--status-revoked-text)] focus:border-[var(--status-revoked-text)]"
                : "border-[var(--border-default)] hover:border-[var(--border-strong)] focus:border-[var(--border-focus)]"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
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

Input.displayName = "Input";
