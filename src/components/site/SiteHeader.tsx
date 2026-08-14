"use client";

import Link from "next/link";

import { useMaintenanceAccess } from "@/components/MaintenancePathGate";
import { MobileNav } from "@/components/site/MobileNav";
import { NavLink } from "@/components/site/NavLink";
import { NAV_ITEMS } from "@/components/site/nav";
import { Wordmark } from "@/components/site/Wordmark";

/**
 * Site-wide masthead. Sticky and translucent so the backdrop keeps showing
 * through, and transparent about where you are — `/ref` renders this inside its
 * theme shell, so the active-link accent follows the current character.
 *
 * Below `sm` the five section links collapse behind a menu button; at `sm` and
 * up they sit inline beside the logo.
 */
export function SiteHeader() {
  const { isAccessible } = useMaintenanceAccess();
  const visibleItems = NAV_ITEMS.filter((item) => isAccessible(item.href));
  const homeAccessible = isAccessible("/");

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/82 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {homeAccessible ? (
          <Link
            href="/"
            className="shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Wordmark compact />
          </Link>
        ) : (
          <span className="shrink-0">
            <Wordmark compact />
          </span>
        )}

        {visibleItems.length > 0 ? (
          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-1">
              {visibleItems.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <MobileNav />
      </div>
    </header>
  );
}
