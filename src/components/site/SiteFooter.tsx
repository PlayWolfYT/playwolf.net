import Link from "next/link";

import { LinkRow } from "@/components/site/LinkRow";
import { NAV_ITEMS } from "@/components/site/nav";
import { getSiteSettings } from "@/lib/references";

export async function SiteFooter() {
  const { links } = await getSiteSettings();

  return (
    <footer className="relative z-10 border-t border-white/[0.07] bg-void/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[120rem] flex-col items-center gap-6 px-4 py-10 sm:px-8">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV_ITEMS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="inline-flex min-h-11 items-center text-xs font-medium uppercase tracking-[0.2em] text-parchment-dim transition hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <LinkRow links={links} />

        <p className="text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim/70">
          © {new Date().getFullYear()} playwolf.net
        </p>
      </div>
    </footer>
  );
}
