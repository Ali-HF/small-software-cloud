import React from "react";
import { Check } from "lucide-react";

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  "data-testid"?: string;
}

export function Stepper({ steps, currentStep, className = "", "data-testid": testId }: StepperProps) {
  return (
    <div data-testid={testId} className={`w-full flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-150 ${
                  isCompleted
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : isCurrent
                    ? "bg-[var(--accent-subtle)] border-2 border-[var(--accent)] text-[var(--accent)]"
                    : "bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <div className="hidden sm:flex flex-col">
                <span
                  className={`text-xs font-medium leading-none ${
                    isCurrent ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[10px] text-[var(--text-faint)] mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors duration-150 ${
                  idx < currentStep ? "bg-[var(--accent)]" : "bg-[var(--border-default)]"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
