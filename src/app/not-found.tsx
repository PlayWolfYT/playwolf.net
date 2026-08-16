import Link from "next/link";
import { Geist, Geist_Mono, Outfit } from "next/font/google";

import { ErrorPageFrame, errorActionClassName } from "@/components/ErrorPageFrame";
import "./globals.css";

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

/**
 * 404 for URLs that match no route at all. Those never enter a route group, so
 * none of the site's layouts run and nothing else pulls in the stylesheet or
 * the fonts — which is why they are imported here. Unmatched URLs used to fall
 * through to the framework's unstyled white page.
 *
 * Next wraps this file in a bare `<html><body>` of its own, so the font
 * variables go on a wrapper element instead: a second `<html>` is dropped by
 * the HTML parser and only earns a hydration mismatch. The dark page
 * background comes from the `body` rule in `globals.css`, which needs no class.
 *
 * `(frontend)/not-found.tsx` stays the answer for `notFound()` thrown inside
 * the site, where the header, footer and backdrop are already rendered.
 */
export default function RootNotFound() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
    >
      {/* Rendered rather than exported as `metadata`, which Next only reads
          from layouts and pages — and this file is neither. */}
      <title>Not found · playwolf.net</title>

      <ErrorPageFrame
        eyebrow="404 — Not found"
        title={"This page isn't here"}
        description="The link may be wrong, or the page may have moved. Double-check the URL, or head back to the home page."
      >
        <Link href="/" className={errorActionClassName}>
          Back home
        </Link>
      </ErrorPageFrame>
    </div>
  );
}
