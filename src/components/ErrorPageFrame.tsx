import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";

/** Shared primary control style for error / not-found actions */
export const errorActionClassName =
  "inline-flex min-h-11 min-w-[8.5rem] items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:border-glow-500/60 hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";

type ErrorPageFrameProps = {
  /** Small label above the title (e.g. code or category) */
  eyebrow: string;
  title: string;
  description: string;
  /** Actions row: links, buttons */
  children?: React.ReactNode;
};

export function ErrorPageFrame({
  eyebrow,
  title,
  description,
  children,
}: ErrorPageFrameProps) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[100lvh] overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="soft" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex justify-center gap-4 text-glow-500/40">
          <SparkStar className="h-4 w-4 animate-twinkle" />
          <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
          <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
        </div>

        <div className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm backdrop-blur-xl">
          <div className="rounded-[calc(1.5rem-1px)] px-8 py-12 text-center shadow-inner-glow sm:px-10 sm:py-14">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-parchment-dim">
              {eyebrow}
            </p>
            <p className="mt-4 font-display text-sm font-medium uppercase tracking-[0.2em] text-glow-500">
              playwolf.net
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-snug tracking-tight text-parchment sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-parchment-muted">
              {description}
            </p>
            {children ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {children}
              </div>
            ) : null}
            <div className="mx-auto mt-10 flex h-1 w-24 overflow-hidden rounded-full bg-void-line">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-glow-600 via-glow-500 to-glow-400 shadow-glow-sm" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
