import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { cookies, headers } from "next/headers";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { Analytics } from "@/components/site/Analytics";
import { NsfwConsentProvider } from "@/components/site/NsfwConsent";
import { SkipToContent } from "@/components/site/SkipToContent";
import { isPathExcludedFromMaintenance, PATHNAME_HEADER } from "@/lib/maintenance";
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

export const metadata: Metadata = {
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
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "playwolf.net",
    title: "playwolf.net",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "playwolf.net",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

/**
 * Every public page is rendered per request. The maintenance gate below reads
 * the database on each one, so none of them could be prerendered anyway — and
 * the production image is built without a database to prerender against.
 *
 * This is cheaper than it sounds: the reads behind it are cached and purged by
 * Payload's write hooks, so a request costs a render rather than a query.
 */
export const dynamic = "force-dynamic";

/**
 * Maintenance mode is enforced here rather than on the home page, so it covers
 * every public route at once. Path prefixes listed in site settings
 * (`maintenanceExcludedPaths`, default `/ref`) stay reachable. Payload's own
 * routes live in a different group and are unaffected, which is what keeps
 * `/admin` reachable to turn it back off again.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, cookieStore, headerStore] = await Promise.all([
    getSiteSettings(),
    cookies(),
    headers(),
  ]);
  const { maintenanceMode, maintenanceMessage, maintenanceExcludedPaths } = settings;
  const pathname = headerStore.get(PATHNAME_HEADER) ?? "/";
  const showMaintenance =
    maintenanceMode &&
    !isPathExcludedFromMaintenance(pathname, maintenanceExcludedPaths);
  const nsfwConsent = cookieStore.get(NSFW_CONSENT_COOKIE)?.value === "1";

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
        suppressHydrationWarning
      >
        {showMaintenance ? (
          <MaintenanceScreen message={maintenanceMessage} />
        ) : (
          <NsfwConsentProvider initialConsent={nsfwConsent}>
            <SkipToContent />
            {children}
            <Analytics />
          </NsfwConsentProvider>
        )}
      </body>
    </html>
  );
}
