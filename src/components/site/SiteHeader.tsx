import Link from "next/link";

import { MobileNav } from "@/components/site/MobileNav";
import { NavLink } from "@/components/site/NavLink";
import { NAV_ITEMS } from "@/components/site/nav";

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
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-void/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[120rem] items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="shrink-0 font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500 transition hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          playwolf.net
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
