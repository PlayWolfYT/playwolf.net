import Link from "next/link";

import { LinkRow } from "@/components/site/LinkRow";
import { NAV_ITEMS } from "@/components/site/nav";
import { Wordmark } from "@/components/site/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSiteSettings } from "@/lib/references";
import { cn } from "@/lib/utils";

export async function SiteFooter() {
  const { links } = await getSiteSettings();

  return (
    <footer className="relative z-10 border-t border-border bg-background/78 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-col items-start gap-5">
            <Wordmark />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Character references, commissioned artwork, and small digital
              experiments—kept in one independent archive.
            </p>
            <LinkRow links={links} align="start" />
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-5 lg:grid-cols-2">
              {NAV_ITEMS.map((section) => (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "w-full justify-start rounded-lg font-mono text-[0.62rem] uppercase tracking-[0.15em]",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} playwolf.net</p>
          <p>Made for curious eyes</p>
        </div>
      </div>
    </footer>
  );
}
