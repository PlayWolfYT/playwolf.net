import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";

import "../globals.css";

/**
 * Own root layout for everything under `/admin` — a route group with its own
 * `html`/`body` so the admin never passes through the frontend's
 * `(frontend)/layout.tsx` (and its maintenance gate). Same fonts as the
 * public site so the two feel like one product.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Admin · playwolf.net",
    template: "%s · Admin · playwolf.net",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
