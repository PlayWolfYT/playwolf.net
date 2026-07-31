"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type KeyNavProps = {
  /** Left arrow destination. */
  prevHref?: string;
  /** Right arrow destination. */
  nextHref?: string;
  /** Escape destination. Omit to leave Escape alone. */
  closeHref?: string;
  /** Replace the history entry rather than pushing one. */
  replace?: boolean;
};

/**
 * Keyboard shortcuts for a gallery: arrows to move between images, Escape to
 * leave. Renders nothing — it is the behaviour attached to links that already
 * exist on the page, so the shortcuts are a shortcut and never the only way to
 * get anywhere.
 */
export function KeyNav({ prevHref, nextHref, closeHref, replace }: KeyNavProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      // Arrow keys mean something else entirely inside a field.
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const href =
        event.key === "ArrowLeft"
          ? prevHref
          : event.key === "ArrowRight"
            ? nextHref
            : event.key === "Escape"
              ? closeHref
              : undefined;
      if (!href) return;

      event.preventDefault();
      if (replace) router.replace(href);
      else router.push(href);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeHref, nextHref, prevHref, replace, router]);

  useEffect(() => {
    // Next only prefetches links in the viewport; these targets are reachable
    // without ever rendering a link into view.
    for (const href of [prevHref, nextHref]) {
      if (href) router.prefetch(href);
    }
  }, [nextHref, prevHref, router]);

  return null;
}
