"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isProfileKey, type ProfileKey } from "@/lib/content";

export type ProfileTab = {
  key: ProfileKey;
  /** Switch label, e.g. "SFW" / "After Dark" */
  label: string;
  /** Small marker rendered inside the switch segment, e.g. `18+` */
  badge?: string;
  /** Canonical URL for this profile */
  href: string;
};

type ProfileSwitcherProps = {
  characterName: string;
  species?: string;
  tabs: ProfileTab[];
};

function keyFromPathname(pathname: string): ProfileKey {
  // /ref/<char>[/<profile>[/<slug>]]
  const segment = pathname.split("/").filter(Boolean)[2];
  return segment && isProfileKey(segment) ? segment : "sfw";
}

/**
 * Sticky profile bar + SFW / After Dark switch via real App Router
 * navigation (`<Link scroll={false}>`). Each route renders only its own
 * profile markup — the inactive panel is never in the HTML.
 *
 * Active state is derived from `usePathname()` so the sliding indicator
 * and accent theme stay in sync with the URL on click and back/forward.
 */
export function ProfileSwitcher({
  characterName,
  species,
  tabs,
}: ProfileSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<ProfileKey, HTMLAnchorElement | null>>>({});

  if (tabs.length === 0) return null;

  const pathKey = keyFromPathname(pathname);
  const active = tabs.some((tab) => tab.key === pathKey) ? pathKey : tabs[0].key;

  const switchTo = (tab: ProfileTab) => {
    if (tab.key === active) return;
    router.push(tab.href, { scroll: false });
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    switchTo(next);
    tabRefs.current[next.key]?.focus();
  };

  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.key === active),
    0,
  );

  return (
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

        {tabs.length > 1 ? (
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
            {tabs.map((tab, index) => {
              const selected = tab.key === active;
              return (
                <Link
                  key={tab.key}
                  ref={(node) => {
                    tabRefs.current[tab.key] = node;
                  }}
                  href={tab.href}
                  scroll={false}
                  role="tab"
                  id={`${baseId}-tab-${tab.key}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 font-display text-xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 sm:px-5 sm:text-sm ${
                    selected
                      ? "text-glow-300"
                      : "text-parchment-dim hover:text-parchment"
                  }`}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span
                      className={`rounded-full border px-1.5 py-px font-mono text-[0.6rem] font-normal tracking-[0.1em] ${
                        selected
                          ? "border-glow-500/50 text-glow-400"
                          : "border-white/15 text-parchment-dim"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
