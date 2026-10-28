import React, { useId } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  "data-testid": testId,
}: SwitchProps) {
  const id = useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-start justify-between gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      {(label || description) && (
        <label htmlFor={id} className="flex flex-col cursor-pointer select-none">
          {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
          {description && <span className="text-xs text-[var(--text-muted)] mt-0.5">{description}</span>}
        </label>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        data-testid={testId}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-ring ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[3px] ml-[3px] ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
