"use client";

import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ErrorPageFrame, errorActionClassName } from "@/components/ErrorPageFrame";

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
  weight: ["300", "400", "500", "600", "700"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans`}
        suppressHydrationWarning
      >
        <ErrorPageFrame
          eyebrow="Critical error"
          title={"The site can't load right now"}
          description="Something failed at the root level. Try reloading the page. If the problem continues, please check back later."
        >
          <button type="button" onClick={reset} className={errorActionClassName}>
            Try again
          </button>
          {process.env.NODE_ENV === "development" && error.message ? (
            <p className="basis-full wrap-break-word text-center font-mono text-[11px] leading-relaxed text-coral-soft/85">
              {error.message}
            </p>
          ) : null}
        </ErrorPageFrame>
      </body>
    </html>
  );
}
