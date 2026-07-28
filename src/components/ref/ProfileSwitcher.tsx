"use client";

import { useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { isProfileKey, type ProfileKey } from "@/lib/references";

export type ProfilePanel = {
  key: ProfileKey;
  /** Switch label, e.g. "SFW" / "After Dark" */
  label: string;
  /** Small marker rendered inside the switch segment, e.g. `18+` */
  badge?: string;
  /** Canonical URL for this profile (pushed via history.pushState) */
  href: string;
  /** Pre-rendered panel (kept server-rendered) */
  content: React.ReactNode;
};

type ProfileSwitcherProps = {
  characterName: string;
  species?: string;
  panels: ProfilePanel[];
};

function keyFromPathname(pathname: string): ProfileKey {
  // /ref/<char>[/<profile>[/<slug>]]
  const segment = pathname.split("/").filter(Boolean)[2];
  return segment && isProfileKey(segment) ? segment : "sfw";
}

/**
 * Sticky profile bar + instant SFW / After Dark switch. Every panel is
 * rendered server-side up front and only hidden with the `hidden` attribute,
 * so switching needs no page load and per-image NSFW reveals survive.
 *
 * Switching updates the URL via `history.pushState`, which Next 15 feeds back
 * into the App Router (`usePathname` updates, no remount). The active panel
 * is *derived* from the pathname — the same source `RefThemeShell` themes
 * from — so the panel and accent colour can never disagree, including on
 * back/forward navigation and history entries created via `pushState`.
 */
export function ProfileSwitcher({
  characterName,
  species,
  panels,
}: ProfileSwitcherProps) {
  const pathname = usePathname();
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<ProfileKey, HTMLButtonElement | null>>>(
    {},
  );

  if (panels.length === 0) return null;

  const pathKey = keyFromPathname(pathname);
  const active = panels.some((panel) => panel.key === pathKey)
    ? pathKey
    : panels[0].key;

  const switchTo = (panel: ProfilePanel) => {
    if (panel.key === active) return;
    window.history.pushState(null, "", panel.href);
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = panels[(index + delta + panels.length) % panels.length];
    switchTo(next);
    tabRefs.current[next.key]?.focus();
  };

  const activeIndex = Math.max(
    panels.findIndex((panel) => panel.key === active),
    0,
  );

  return (
    <div className="w-full">
      {/* Sticky profile bar, directly below the h-14 site header */}
      <div className="sticky top-14 z-20 -mx-4 mb-10 border-b border-white/[0.07] bg-void/75 px-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-medium tracking-tight text-parchment sm:text-xl">
              {characterName}
            </h1>
            {species ? (
              <p className="mt-0.5 truncate font-mono text-[0.6rem] uppercase tracking-[0.2em] text-parchment-dim">
                {species}
              </p>
            ) : null}
          </div>

          {panels.length > 1 ? (
            <div
              role="tablist"
              aria-label="Character profiles"
              className="relative grid min-h-11 flex-none select-none grid-cols-2 items-stretch rounded-full border border-white/15 bg-void/80 p-1"
            >
              {/* Sliding indicator */}
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full border border-glow-500/50 bg-glow-500/15 shadow-glow-sm transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
              {panels.map((panel, index) => {
                const selected = panel.key === active;
                return (
                  <button
                    key={panel.key}
                    ref={(node) => {
                      tabRefs.current[panel.key] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${panel.key}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${panel.key}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => switchTo(panel)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                    className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 font-display text-xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 sm:px-5 sm:text-sm ${
                      selected
                        ? "text-glow-300"
                        : "text-parchment-dim hover:text-parchment"
                    }`}
                  >
                    {panel.label}
                    {panel.badge ? (
                      <span
                        className={`rounded-full border px-1.5 py-px font-mono text-[0.6rem] font-normal tracking-[0.1em] ${
                          selected
                            ? "border-glow-500/50 text-glow-400"
                            : "border-white/15 text-parchment-dim"
                        }`}
                      >
                        {panel.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {panels.map((panel) => (
        <div
          key={panel.key}
          role="tabpanel"
          id={`${baseId}-panel-${panel.key}`}
          aria-labelledby={`${baseId}-tab-${panel.key}`}
          hidden={panel.key !== active}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
