import { FooterNav } from "@/components/site/FooterNav";
import { LinkRow } from "@/components/site/LinkRow";
import { Wordmark } from "@/components/site/Wordmark";
import { Separator } from "@/components/ui/separator";
import { getSiteSettings } from "@/lib/references";

export async function SiteFooter() {
  const { links } = await getSiteSettings();

  return (
    <footer className="relative z-10 border-t border-border bg-background/78 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-col items-start gap-5">
            <Wordmark />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              My characters, favorite artwork, and small digital experiments, all in one
              place.
            </p>
            <LinkRow links={links} align="start" />
          </div>

          <FooterNav />
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} playwolf.net</p>
          <p>Made for fun</p>
        </div>
      </div>
    </footer>
  );
}
