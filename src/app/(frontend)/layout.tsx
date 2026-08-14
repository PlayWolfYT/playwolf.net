import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import { cookies } from "next/headers";
import { NsfwConsentProvider } from "@/components/site/NsfwConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NSFW_CONSENT_COOKIE } from "@/lib/nsfw";
import "../globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#0d0c0b",
  viewportFit: "cover",
};

/**
 * Every public page is rendered per request. The maintenance gate in
 * `template.tsx` reads the database on each navigation, so none of them could
 * be prerendered anyway — and the production image is built without a database
 * to prerender against.
 *
 * This is cheaper than it sounds: the reads behind it are cached and purged by
 * Payload's write hooks, so a request costs a render rather than a query.
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
    <html
      lang="en"
      className={`${manrope.variable} ${ibmPlexMono.variable} ${syne.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <TooltipProvider>
          <NsfwConsentProvider initialConsent={nsfwConsent}>
            {children}
          </NsfwConsentProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
