import Link from "next/link";

import { MobileNav } from "@/components/site/MobileNav";
import { NavLink } from "@/components/site/NavLink";
import { NAV_ITEMS } from "@/components/site/nav";
import { Wordmark } from "@/components/site/Wordmark";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Site-wide masthead. Sticky and translucent so the backdrop keeps showing
 * through, and transparent about where you are — `/ref` renders this inside its
 * theme shell, so the active-link accent follows the current character.
 *
 * Below `sm` the five section links collapse behind a menu button; at `sm` and
 * up they sit inline beside the logo.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/82 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 rounded-lg transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Wordmark compact />
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <Badge
            variant="outline"
            className="hidden border-signal/25 text-signal lg:inline-flex"
          >
            2026 edition
          </Badge>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
