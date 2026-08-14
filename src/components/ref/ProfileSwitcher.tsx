"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useRef } from "react";

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

export function ProfileSwitcher({
  characterName,
  species,
  tabs,
}: ProfileSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmNsfw } = useNsfwConsent();
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<ProfileKey, HTMLAnchorElement | null>>>({});

  if (tabs.length === 0) return null;

  const pathKey = keyFromPathname(pathname);
  const active = tabs.some((tab) => tab.key === pathKey) ? pathKey : tabs[0].key;

  const switchTo = async (tab: ProfileTab) => {
    if (tab.key === active) return;
    if (tab.key === "nsfw" && !(await confirmNsfw())) return;
    router.push(tab.href, { scroll: false });
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    void switchTo(next);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <div className="sticky top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-20 mb-10 rounded-2xl border border-border bg-card/88 p-3 shadow-glow-md backdrop-blur-2xl">
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
          <div
            role="tablist"
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
                  scroll={false}
                  role="tab"
                  id={`${baseId}-tab-${tab.key}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    buttonVariants({
                      variant: selected ? "default" : "outline",
                      size: "sm",
                    }),
                    "rounded-xl",
                  )}
                >
                  {tab.label}
                  {tab.badge ? (
                    <Badge variant={selected ? "secondary" : "outline"}>
                      {tab.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <Badge variant="outline">{tabs[0].label}</Badge>
        )}
      </div>
    </div>
  );
}
