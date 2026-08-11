import { BrandBackdrop } from "@/components/BrandBackdrop";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MAIN_CONTENT_ID } from "@/components/site/SkipToContent";

/**
 * Chrome for the portfolio side of the site. `/ref` has its own layout because
 * it wraps the same header and footer in a per-character theme; everything
 * else shares this one.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-void">
      {/* `100lvh` keeps the layer stable when mobile browser chrome shows/hides. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[100lvh] overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="soft" />
      </div>

      <SiteHeader />

      <main id={MAIN_CONTENT_ID} className="relative z-10 flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
