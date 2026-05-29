"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "nsfw-revealed";
const REVEAL_EVENT = "nsfw-reveal";

function readRevealed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist reveal state and notify every other mounted instance (and tab). */
function setRevealedStored(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage may be unavailable (private mode); event still syncs this tab */
  }
  window.dispatchEvent(new CustomEvent(REVEAL_EVENT));
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
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
 * blur here is a CSS-only overlay. Once revealed, the choice is remembered in
 * `localStorage` and broadcast so every instance unblurs together; the eye
 * toggle can re-hide them all.
 *
 * Click behavior with `href`: while blurred, clicking reveals (no navigation);
 * once revealed, clicking navigates to `href`.
 */
export function NsfwReveal({ children, variant = "full", href }: NsfwRevealProps) {
  // Start hidden on both server and first client render to avoid hydration
  // mismatch; reconcile with stored state in the effect below.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(readRevealed());

    const sync = () => setRevealed(readRevealed());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) sync();
    };

    window.addEventListener(REVEAL_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(REVEAL_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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

      {/* Show/hide blur toggle */}
      <button
        type="button"
        onClick={() => setRevealedStored(!revealed)}
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
          onClick={() => setRevealedStored(true)}
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
