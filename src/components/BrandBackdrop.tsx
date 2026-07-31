type BrandBackdropProps = {
  /** Larger orbs + stronger rim for the maintenance hero */
  density?: "full" | "soft";
};

export function BrandBackdrop({ density = "full" }: BrandBackdropProps) {
  const isFull = density === "full";

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[size:56px_56px] bg-grid-soft opacity-90"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-rim-cyan" aria-hidden />
      <div
        className={`pointer-events-none absolute rounded-full bg-glow-500/25 blur-[100px] animate-drift ${
          isFull
            ? "-left-40 top-1/4 h-[min(90vw,520px)] w-[min(90vw,520px)]"
            : "left-1/2 top-[28%] h-[min(85vw,400px)] w-[min(85vw,400px)] -translate-x-1/2"
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute rounded-full bg-glow-600/20 blur-[88px] animate-slow-pulse ${
          isFull
            ? "-right-32 bottom-0 h-[420px] w-[420px]"
            : "right-[10%] bottom-[12%] h-64 w-64"
        }`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-void via-void-soft/90 to-transparent"
        aria-hidden
      />
      {/* Soft accent wash — very subtle, follows the active profile theme */}
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[min(100vw,480px)] -translate-x-1/2 rounded-full bg-glow-400/10 blur-[100px]"
        aria-hidden
      />
    </>
  );
}

/** Tiny four-point star — accessory geometry from reference art */
export function SparkStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.5l1.8 5.5h5.7l-4.6 3.4 1.8 5.5-4.7-3.4-4.7 3.4 1.8-5.5-4.6-3.4h5.7L12 1.5z" />
    </svg>
  );
}
