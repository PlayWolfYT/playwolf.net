import Link from "next/link";

import { NavLink } from "@/components/site/NavLink";
import { NAV_ITEMS } from "@/components/site/nav";

/**
 * Site-wide masthead. Sticky and translucent so the backdrop keeps showing
 * through, and transparent about where you are — `/ref` renders this inside its
 * theme shell, so the active-link accent follows the current character.
 *
 * The nav scrolls sideways rather than collapsing behind a menu button: six
 * short labels fit on anything but a phone, and a swipe beats a tap plus an
 * overlay for the phone case.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-void/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[120rem] items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="shrink-0 font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500 transition hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          playwolf.net
        </Link>

        <nav aria-label="Primary" className="min-w-0 overflow-x-auto">
          <ul className="flex items-center gap-1 whitespace-nowrap sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
