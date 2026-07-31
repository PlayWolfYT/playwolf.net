import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { Analytics } from "@/components/site/Analytics";
import { SkipToContent } from "@/components/site/SkipToContent";
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
 * every public route at once. Payload's own routes live in a different group
 * and are unaffected, which is what keeps `/admin` reachable to turn it back
 * off again.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { maintenanceMode, maintenanceMessage } = await getSiteSettings();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
        suppressHydrationWarning
      >
        {maintenanceMode ? (
          <MaintenanceScreen message={maintenanceMessage} />
        ) : (
          <>
            <SkipToContent />
            {children}
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}
