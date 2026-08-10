"use client";

import { useState, type ReactNode } from "react";

/**
 * Client-side tab switcher for a single `<form>` that covers more ground
 * than fits comfortably in one view. Panels are hidden with CSS rather than
 * unmounted, so every field — visible tab or not — still submits with the form.
 */
export function AdminTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition ${
              active === tab.key
                ? "border-sky-600 text-sky-800"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
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
