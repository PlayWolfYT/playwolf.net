"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // History length is fixed for this document view; no external subscription.
  return () => {};
}

function getSnapshot() {
  return window.history.length > 1;
}

function getServerSnapshot() {
  return false;
}

/**
 * Shown on the maintenance screen when the visitor navigated here from
 * another page (browser history is non-empty). Direct landings skip it.
 */
export function MaintenanceBackButton() {
  const canGoBack = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-medium text-parchment-muted transition hover:border-glow-500/40 hover:bg-glow-500/10 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      <span aria-hidden className="text-glow-400">
        ←
      </span>
      Back
    </button>
  );
}
