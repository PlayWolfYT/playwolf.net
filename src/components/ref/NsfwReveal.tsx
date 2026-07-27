"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGlobalNsfw } from "@/components/ref/nsfw-state";

type IconProps = { className?: string };

export function EyeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-3.2 4.1" />
      <path d="M6.6 6.6A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

type NsfwRevealProps = {
  children: React.ReactNode;
  /** Tightens the rounding/overlay padding for grid thumbnails */
  variant?: "full" | "thumb";
  /** When set, the (revealed) image links here; clicks while blurred reveal instead of navigating */
  href?: string;
};

/**
 * Client-side blur gate for NSFW media. The wrapped image is always rendered
 * with its real `src`, so crawlers/OG embeds receive the unblurred asset — the
 * blur here is a CSS-only overlay.
 *
 * Two layers decide whether this image is blurred: the persisted global switch
 * (see `nsfw-state.ts`, driven by the header toggle) and an ephemeral local
 * override that applies to this image only. Flipping the global switch in
 * either direction drops the override, so the master switch always wins.
 *
 * Click behavior with `href`: while blurred, clicking reveals (no navigation);
 * once revealed, clicking navigates to `href`.
 */
export function NsfwReveal({ children, variant = "full", href }: NsfwRevealProps) {
  const { revealed: globalRevealed, version } = useGlobalNsfw();
  // `null` means "follow the global switch". Component state only, so the
  // override is dropped on navigation and reload.
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    setOverride(null);
  }, [version]);

  const revealed = override ?? globalRevealed;
  const isThumb = variant === "thumb";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={`relative h-full w-full transition duration-300 ${
          revealed ? "" : "scale-105 blur-2xl"
        }`}
      >
        {children}
      </div>

      {/* Show/hide blur toggle — this image only */}
      <button
        type="button"
        onClick={() => setOverride(!revealed)}
        aria-label={revealed ? "Hide NSFW content" : "Reveal NSFW content (18+)"}
        aria-pressed={revealed}
        title={revealed ? "Hide" : "Reveal (18+)"}
        className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment backdrop-blur transition hover:border-glow-500/40 hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>

      {/* Click layer: reveal while blurred, navigate (if href) once revealed */}
      {revealed ? (
        href ? (
          <Link
            href={href}
            aria-label="View image"
            className="absolute inset-0 z-10"
          />
        ) : null
      ) : (
        <button
          type="button"
          onClick={() => setOverride(true)}
          aria-label="Reveal NSFW content. You must be 18 or older."
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-void/55 text-center transition hover:bg-void/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${
            isThumb ? "px-3" : "px-6"
          }`}
        >
          <span
            className={`font-display font-medium text-parchment ${
              isThumb ? "text-sm" : "text-base sm:text-lg"
            }`}
          >
            Click to reveal
          </span>
          <span className="rounded-full border border-glow-500/40 bg-glow-500/10 px-3 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-glow-400">
            18+
          </span>
        </button>
      )}
    </div>
  );
}
