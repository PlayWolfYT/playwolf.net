import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";

/**
 * `message` comes from the `siteSettings` global, so the reason for the outage
 * can be changed without a deploy. Blank falls back to the standing copy.
 */
export function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <BrandBackdrop density="full" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow-400/40 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-glow-500 shadow-glow-sm ring-4 ring-glow-500/25" />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.35em] text-parchment-dim">
            Status
          </span>
          <span className="rounded-full border border-glow-500/35 bg-glow-500/10 px-3 py-1 text-xs font-medium text-glow-400 shadow-glow-sm">
            Maintenance
          </span>
        </div>

        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-px shadow-glow-md backdrop-blur-2xl">
          <div className="absolute -right-6 -top-4 text-glow-500/50 animate-twinkle">
            <SparkStar className="h-5 w-5" />
          </div>
          <div className="absolute -left-4 top-1/3 text-glow-500/30">
            <SparkStar className="h-3 w-3" />
          </div>

          <div className="relative rounded-[calc(1.5rem-1px)] bg-void-panel/80 px-8 py-12 shadow-inner-glow sm:px-12 sm:py-14">
            <p className="text-center font-display text-sm font-medium uppercase tracking-[0.22em] text-glow-500">
              playwolf.net
            </p>
            <h1 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-parchment sm:text-5xl">
              Website{" "}
              <span className="bg-gradient-to-r from-glow-300 via-glow-500 to-glow-600 bg-clip-text text-transparent">
                in development
              </span>
            </h1>
            {message ? (
              <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-center text-base leading-relaxed text-parchment-muted">
                {message}
              </p>
            ) : (
              <>
                <p className="mx-auto mt-6 max-w-md text-center text-base leading-relaxed text-parchment-muted">
                  The website is still currently in development as I dont have much time
                  to work on it.
                </p>
                <p className="mx-auto mt-6 max-w-md text-center text-base leading-relaxed text-parchment-muted">
                  Please check back again later~
                </p>
              </>
            )}
            <div className="mx-auto mt-10 h-px max-w-xs bg-gradient-to-r from-transparent via-glow-500/55 to-transparent" />
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-parchment-dim/80">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          playwolf.net
        </p>
      </div>
    </main>
  );
}
