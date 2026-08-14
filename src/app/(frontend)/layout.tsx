import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { NsfwConsentProvider } from "@/components/site/NsfwConsent";
import { ogImage, OG_SITE_FIELDS } from "@/lib/embed";
import { NSFW_CONSENT_COOKIE } from "@/lib/nsfw";
import { getSiteSettings } from "@/lib/references";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Only the weights the display styles actually ask for; 700 is never used. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

const siteDescription =
  "Character reference sheets, art examples, and portfolio for playwolf.";

/**
 * Site-wide defaults only. Deliberately absent:
 *
 * - `openGraph.title` / `openGraph.description` — a value here is inherited by
 *   every descendant, so hard-coding them made each page's own `og:title` read
 *   "playwolf.net". Left unset, Next fills them from the page's resolved
 *   `title`/`description`.
 * - `openGraph.url` — same inheritance problem: every page claimed the home
 *   page's address. Pages with a preview of their own now set it; the rest rely
 *   on `rel="canonical"` (see `OG_SITE_FIELDS` in `lib/embed.ts` for why).
 * - `alternates.canonical` — would point every page at `/`.
 *
 * `metadataBase` must stay: it is what turns the relative media paths in
 * `og:image` into the absolute URLs unfurlers require.
 *
 * `openGraph.images` is only set when the operator has uploaded one, so that
 * the generated `opengraph-image.tsx` in this segment supplies the fallback
 * otherwise. Config metadata beats the file convention within a segment;
 * a descendant page's own images beat both.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // Spread rather than `images: undefined`: an explicitly undefined key still
  // counts as "answered" and suppresses `opengraph-image.tsx`.
  const preview = settings.ogImage
    ? { images: [ogImage(settings.ogImage, "playwolf.net")] }
    : {};

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "playwolf.net",
      template: "%s · playwolf.net",
    },
    description: siteDescription,
    applicationName: "playwolf.net",
    icons: {
      icon: "/favicon.ico",
      apple: "/favicon.ico",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      ...OG_SITE_FIELDS,
      ...preview,
    },
    twitter: {
      card: "summary_large_image",
      ...(settings.ogImage ? { images: [settings.ogImage.src] } : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#050506",
  viewportFit: "cover",
};

/**
 * Every public page is rendered per request. Permanent, not provisional: the
 * static-rendering spike found five independent blockers, each enough on its own
 * to stop any `(frontend)` route prerendering.
 *
 * 1. `headers()` in `template.tsx`, reading the `x-pathname` the proxy injects
 *    to drive the maintenance gate.
 * 2. `cookies()` below, for the 18+ consent.
 * 3. `getAdminUser()` on the artwork route — `headers()` plus a live
 *    `payload.auth()`. That route is both the most numerous on the site and the
 *    one whose URLs get sent to artists, so it could only go static by moving
 *    commission metadata behind an authenticated client fetch.
 * 4. `useSearchParams()` in `NsfwConsent`, which this layout wraps every route
 *    in. With `cacheComponents` off a prerender throws `BailoutToCSRError`, and
 *    reports it against the *page* rather than this provider. Suspense is not
 *    the fix: `children` arrives as a prop, so the prerender would emit the
 *    fallback and the page would ship empty.
 * 5. `getCharacters()`/`getProjects()` do not swallow an unreachable database
 *    the way `getSiteSettings()` does, and the `Dockerfile` builds with no
 *    `DATABASE_URL`, so prerendering `/`, `/projects` or `/ref` throws outright.
 *
 * `generateStaticParams` would not rescue it: `enumerate()` answers `[]` without
 * a database, so zero pages would prerender. Nor would the output survive —
 * `docker-compose.yml` persists only `/app/.next/cache`, while full-route HTML
 * is written to `serverDistDir/app` in the container's ephemeral layer.
 *
 * Per-request is cheaper than it sounds: the reads behind it are cached and
 * purged by Payload's write hooks, so a request costs a render, not a query.
 */
export const dynamic = "force-dynamic";

/**
 * Shell only: fonts, consent provider, document chrome. Maintenance mode is
 * enforced in `template.tsx` so soft navigations re-check the current path.
 * Payload's own routes live in a different group and are unaffected, which
 * keeps `/admin` reachable to turn maintenance back off.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const nsfwConsent = cookieStore.get(NSFW_CONSENT_COOKIE)?.value === "1";

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
        suppressHydrationWarning
      >
        {/* The provider renders `children` whether or not consent was given —
            the warning is an overlay on top. That is required, not an
            oversight: link unfurlers and Google Images read the markup without
            a consent cookie, and After Dark references have to embed. */}
        <NsfwConsentProvider initialConsent={nsfwConsent}>
          {children}
        </NsfwConsentProvider>
      </body>
    </html>
  );
}
