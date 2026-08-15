"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

import { useNsfwConsent } from "@/components/site/NsfwConsent";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isProfileKey, type ProfileKey } from "@/lib/content";
import { cn } from "@/lib/utils";

export type ProfileTab = {
  key: ProfileKey;
  label: string;
  badge?: string;
  href: string;
};

type ProfileSwitcherProps = {
  characterName: string;
  species?: string;
  tabs: ProfileTab[];
};

function keyFromPathname(pathname: string): ProfileKey {
  const segment = pathname.split("/").filter(Boolean)[2];
  return segment && isProfileKey(segment) ? segment : "sfw";
}

/**
 * Because these are two URLs rather than two panels, the switch is a `nav`
 * landmark with `aria-current="page"` — not a `tablist`. The ARIA tabs pattern
 * expects a roving `tabIndex`, which took After Dark out of the tab order
 * entirely even though it is an ordinary link to an ordinary page, and
 * `role="tab"` promises a `tabpanel` that does not exist. The `aria-label`
 * keeps this landmark apart from `SiteHeader`'s "Primary" nav, which the `/ref`
 * layout renders above it.
 */
export function ProfileSwitcher({
  characterName,
  species,
  tabs,
}: ProfileSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmNsfw } = useNsfwConsent();
  const tabRefs = useRef<Partial<Record<ProfileKey, HTMLAnchorElement | null>>>({});

  if (tabs.length === 0) return null;

  const pathKey = keyFromPathname(pathname);
  const active = tabs.some((tab) => tab.key === pathKey) ? pathKey : tabs[0].key;

  const switchTo = async (tab: ProfileTab) => {
    if (tab.key === active) return;
    if (tab.key === "nsfw" && !(await confirmNsfw())) return;
    router.push(tab.href, { scroll: true });
  };

  // Arrow keys still move between the two profiles without a click, so the 18+
  // warning has to be asked for here as well — the provider's click gate never
  // sees these.
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    void switchTo(next);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <div className="sticky top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-20 mb-10 overflow-hidden rounded-2xl border border-glow-500/35 bg-[linear-gradient(120deg,rgb(var(--accent-500)/0.12),rgb(var(--accent-700)/0.04)_45%,rgb(var(--accent-500)/0.08))] p-3 shadow-[0_20px_70px_-42px_rgb(var(--accent-500)/0.95)] backdrop-blur-2xl">
      <span
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-glow-300/90 to-transparent shadow-[0_0_18px_rgb(var(--accent-500)/0.8)]"
        aria-hidden
      />
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 px-2">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-primary">
            Active character
          </p>
          <h1 className="mt-1 truncate font-display text-xl font-bold tracking-[-0.045em]">
            {characterName}
          </h1>
          {species ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{species}</p>
          ) : null}
        </div>

        {tabs.length > 1 ? (
          <nav
            aria-label="Character profiles"
            className="flex flex-wrap items-center gap-2"
          >
            {tabs.map((tab, index) => {
              const selected = tab.key === active;
              return (
                <Link
                  key={tab.key}
                  ref={(node) => {
                    tabRefs.current[tab.key] = node;
                  }}
                  href={tab.href}
                  scroll
                  aria-current={selected ? "page" : undefined}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    buttonVariants({
                      variant: selected ? "default" : "outline",
                      size: "sm",
                    }),
                    "rounded-xl",
                    selected
                      ? "border-glow-300/40 shadow-[0_0_24px_-7px_rgb(var(--accent-500)/0.95)]"
                      : "border-glow-500/25 bg-glow-500/[0.04] hover:border-glow-400/55 hover:bg-glow-500/12 hover:text-glow-300",
                  )}
                >
                  {tab.label}
                  {tab.badge ? (
                    <Badge
                      variant="outline"
                      className={
                        selected
                          ? "border-primary-foreground/30 text-primary-foreground"
                          : "border-glow-500/30 text-glow-300"
                      }
                    >
                      {tab.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        ) : (
          <Badge
            variant="outline"
            className="border-glow-500/40 bg-glow-500/10 text-glow-300"
          >
            {tabs[0].label}
          </Badge>
        )}
      </div>
    </div>
  );
}
