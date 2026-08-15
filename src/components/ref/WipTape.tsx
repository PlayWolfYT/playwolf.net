/**
 * Diagonal corner tape badge — sits over WIP sketches so they're unmistakably
 * unfinished even when the image itself looks polished.
 */
export function WipTape({ label = "WIP" }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-8 top-3 z-20 w-36 rotate-45 bg-secondary py-1 text-center shadow-glow-sm"
    >
      <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-secondary-foreground">
        {label}
      </span>
    </div>
  );
}
