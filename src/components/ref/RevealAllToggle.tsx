"use client";

import { EyeIcon, EyeOffIcon } from "@/components/ref/NsfwReveal";
import { setGlobalNsfw, useGlobalNsfw } from "@/components/ref/nsfw-state";

/**
 * Master switch for the NSFW blur, rendered inside the After Dark panel.
 * Turning it on unblurs every gated image; turning it off re-hides them,
 * discarding any per-image reveals.
 */
export function RevealAllToggle() {
  const { revealed } = useGlobalNsfw();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={revealed}
      onClick={() => setGlobalNsfw(!revealed)}
      className={`inline-flex min-h-11 select-none items-center gap-2 rounded-full border px-5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${
        revealed
          ? "border-glow-500/60 bg-glow-500/10 text-glow-300 shadow-glow-sm hover:border-glow-500/80 hover:bg-glow-500/20"
          : "border-white/10 bg-void-lift/70 text-parchment-muted hover:border-white/25 hover:text-parchment"
      }`}
    >
      {revealed ? (
        <EyeOffIcon className="h-4 w-4" />
      ) : (
        <EyeIcon className="h-4 w-4" />
      )}
      {revealed ? "Hide all" : "Reveal all"}
      <span
        className={`rounded-full border px-1.5 py-px font-mono text-[0.6rem] tracking-[0.1em] ${
          revealed
            ? "border-glow-500/50 text-glow-400"
            : "border-white/15 text-parchment-dim"
        }`}
      >
        18+
      </span>
    </button>
  );
}
