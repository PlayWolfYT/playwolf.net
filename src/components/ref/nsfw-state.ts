"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nsfw-revealed";
const REVEAL_EVENT = "nsfw-reveal";

function readGlobalNsfw(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist the global reveal choice and notify every listener (and tab). */
export function setGlobalNsfw(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage may be unavailable (private mode); event still syncs this tab */
  }
  window.dispatchEvent(new CustomEvent(REVEAL_EVENT));
}

export type GlobalNsfwState = {
  revealed: boolean;
  /** Bumped on every global change so consumers can drop local overrides. */
  version: number;
};

/**
 * Subscribes to the shared NSFW reveal switch. Reports `false` on the server
 * and on the first client render to keep hydration stable, then reconciles
 * with storage in an effect.
 */
export function useGlobalNsfw(): GlobalNsfwState {
  const [state, setState] = useState<GlobalNsfwState>({
    revealed: false,
    version: 0,
  });

  useEffect(() => {
    const sync = () =>
      setState((previous) => ({
        revealed: readGlobalNsfw(),
        version: previous.version + 1,
      }));

    sync();

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

  return state;
}
