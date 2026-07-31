import { BrandBackdrop } from "@/components/BrandBackdrop";
import { BackdropDecor } from "@/components/ref/BackdropDecor";
import { RefThemeShell } from "@/components/ref/RefThemeShell";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MAIN_CONTENT_ID } from "@/components/site/SkipToContent";
import { getAccentMap } from "@/lib/references";

export default async function RefLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // RefThemeShell applies the per-profile accent CSS variables, so everything
    // inside it — header, backdrop, content, footer — follows the active
    // character's colour. The serializable accent map is built here on the
    // server so the client shell stays free of the content layer.
    <RefThemeShell accentMap={await getAccentMap()}>
      {/* Backdrop layer. `fixed` anchors it to the viewport, so orb/decor
          positions are stable regardless of page height (switching profiles
          changes the page length and used to shift percentage-based
          positions). Clipping lives here rather than on the shell: an
          `overflow` value other than `visible` on a scroll ancestor disables
          `position: sticky` for the header below. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <BrandBackdrop density="soft" />
        <BackdropDecor />
      </div>

      <SiteHeader />

      <main
        id={MAIN_CONTENT_ID}
        className="relative z-10 mx-auto w-full max-w-[120rem] flex-1 px-4 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14"
      >
        {children}
      </main>

      <SiteFooter />
    </RefThemeShell>
  );
}
