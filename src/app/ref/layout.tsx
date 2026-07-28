import Link from "next/link";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { BackdropDecor } from "@/components/ref/BackdropDecor";
import { RefThemeShell } from "@/components/ref/RefThemeShell";
import { getAccentMap } from "@/lib/references";

export default function RefLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // RefThemeShell renders the <main> wrapper and applies the per-profile
    // accent CSS variables so everything below (header, backdrop, content)
    // follows the active character profile's colour. The serializable accent
    // map is built here on the server so the client shell stays free of
    // character-data (image) imports.
    <RefThemeShell accentMap={getAccentMap()}>
      {/* Backdrop layer. `fixed` anchors it to the viewport, so orb/decor
          positions are stable regardless of page height (switching profiles
          changes the page length and used to shift percentage-based
          positions). Clipping lives here rather than on the shell: an
          `overflow` value other than `visible` on a scroll ancestor disables
          `position: sticky` for the header below. */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="soft" />
        <BackdropDecor />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-void/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[120rem] items-center justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/ref"
            className="font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500 transition hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
          >
            playwolf.net
          </Link>
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-[0.2em] text-parchment-dim transition hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-[120rem] flex-1 px-4 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
        {children}
      </div>
    </RefThemeShell>
  );
}
