import Link from "next/link";
import { BrandBackdrop } from "@/components/BrandBackdrop";

export default function RefLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center overflow-hidden bg-void px-6 py-12 sm:py-16">
      <BrandBackdrop density="soft" />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
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

        {children}
      </div>
    </main>
  );
}
