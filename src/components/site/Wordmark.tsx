import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary font-mono text-[0.65rem] font-semibold tracking-[-0.08em] text-primary-foreground shadow-glow-sm">
        <span className="absolute -right-2 -top-3 size-5 rotate-45 bg-signal/90" />
        <span className="relative">PW</span>
      </span>
      <span
        className={cn(
          "font-display text-sm font-bold leading-none tracking-[-0.04em] text-foreground",
          compact && "sr-only sm:not-sr-only",
        )}
      >
        playwolf.net
      </span>
    </span>
  );
}
