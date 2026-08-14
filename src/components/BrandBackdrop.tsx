import { cn } from "@/lib/utils";

type BrandBackdropProps = {
  /** Larger orbs + stronger rim for the maintenance hero */
  density?: "full" | "soft";
};

export function BrandBackdrop({ density = "full" }: BrandBackdropProps) {
  const isFull = density === "full";

  return (
    <div className="absolute inset-0 overflow-hidden bg-void">
      <div
        className="pointer-events-none absolute inset-0 brand-noise opacity-45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-size-[72px_72px] bg-grid-soft opacity-75 mask-[linear-gradient(to_bottom,black,transparent_88%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-rim-cyan"
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute rounded-full border border-glow-500/25",
          isFull
            ? "-left-[18rem] top-[8%] size-[44rem]"
            : "-left-[14rem] top-[16%] size-[34rem]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute rounded-full border border-dashed border-parchment/10",
          isFull
            ? "-left-[14rem] top-[13%] size-[36rem]"
            : "-left-[10rem] top-[21%] size-[27rem]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute animate-drift rounded-full bg-glow-500/18 blur-[110px]",
          isFull
            ? "-right-32 top-[4%] size-[34rem]"
            : "-right-24 top-[14%] size-[26rem]",
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[7%] top-[18%] h-[46%] w-px rotate-12 bg-linear-to-b from-transparent via-signal/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[calc(7%+1.15rem)] top-[19%] h-[43%] w-px rotate-12 bg-linear-to-b from-transparent via-glow-400/45 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-[12%] size-72 rounded-full border border-signal/12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-linear-to-t from-void via-void/85 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-8 left-8 hidden items-center gap-3 font-mono text-[0.55rem] uppercase tracking-[0.35em] text-parchment/20 lg:flex"
        aria-hidden
      >
        <span className="block h-px w-14 bg-current" />
        independent image archive
      </div>
    </div>
  );
}

/** Four-point registration spark used as a compact brand mark. */
export function SparkStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c.8 7.1 4.9 11.2 12 12-7.1.8-11.2 4.9-12 12C11.2 16.9 7.1 12.8 0 12 7.1 11.2 11.2 7.1 12 0Z" />
    </svg>
  );
}
