"use client";

import { useState, type ReactNode } from "react";

/**
 * Client-side tab switcher for a single `<form>` that covers more ground
 * than fits comfortably in one view (character SFW / After Dark profiles).
 * Panels are hidden with CSS rather than unmounted, so every field — visible
 * tab or not — is still part of the form and submits with it.
 */
export function AdminTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 rounded-full border border-white/[0.08] bg-void-lift/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              active === tab.key
                ? "bg-glow-500/15 text-glow-300 shadow-glow-sm"
                : "text-parchment-dim hover:text-parchment-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div key={tab.key} hidden={active !== tab.key} className="flex flex-col gap-4">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
