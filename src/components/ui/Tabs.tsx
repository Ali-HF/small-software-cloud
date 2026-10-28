"use client";

import React, { createContext, useContext } from "react";

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  value: "",
  onChange: () => {},
});

export function Tabs({
  value,
  onValueChange,
  children,
  className = "",
  "data-testid": testId,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div data-testid={testId} className={`flex flex-col gap-4 w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-1 border-b border-[var(--border-default)] ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  icon,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 cursor-pointer focus-ring ${
        isActive
          ? "border-[var(--accent)] text-[var(--text-primary)] font-semibold"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
      } ${className}`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div role="tabpanel" className={`w-full ${className}`}>
      {children}
    </div>
  );
}
