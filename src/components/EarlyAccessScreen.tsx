import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";

export function EarlyAccessScreen() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <BrandBackdrop density="soft" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex justify-center gap-4 text-glow-500/40">
          <SparkStar className="h-4 w-4 animate-twinkle" />
          <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
          <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
        </div>

        <div className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm backdrop-blur-xl">
          <div className="rounded-[calc(1.5rem-1px)] px-8 py-12 text-center shadow-inner-glow sm:px-10 sm:py-14">
            <p className="font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500">
              playwolf.net
            </p>
            <h1 className="mt-6 font-display text-3xl font-light leading-snug tracking-tight text-parchment sm:text-4xl">
              You&apos;re here early…{" "}
              <span className="block pt-1 font-medium text-glow-400 sm:inline sm:pt-0">
                please come back later!
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-parchment-muted">
              Nothing to see just yet—but something fun is on the way.
            </p>
            <div className="mx-auto mt-10 flex h-1 w-24 overflow-hidden rounded-full bg-void-line">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-glow-600 via-glow-500 to-glow-400 shadow-glow-sm" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
