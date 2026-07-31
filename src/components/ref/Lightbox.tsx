"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type LightboxProps = {
  /** The artwork, already rendered by the server. */
  children: ReactNode;
  title: string;
  /** Shown under the title — the credit bar, open-original link and so on. */
  footer?: ReactNode;
  prevHref?: string;
  nextHref?: string;
  /** Where Escape and the close button go when there is no history to pop. */
  fallbackHref: string;
};

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${className}`}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/** Never notifies: the value only differs between server and client. */
const noSubscribe = () => () => {};

const ARROW_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment-muted backdrop-blur transition hover:border-glow-500/40 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";

/**
 * Overlay for an artwork opened from a gallery, mounted by the intercepting
 * route so the URL is the artwork's own page. Closing pops the history entry,
 * which puts the grid back exactly where it was; a hard load of the same URL
 * misses the interception and renders the standalone page instead.
 *
 * Portalled to `<body>` because the reference chrome uses backdrop filters,
 * and those make an ancestor the containing block for `position: fixed`.
 */
export function Lightbox({
  children,
  title,
  footer,
  prevHref,
  nextHref,
  fallbackHref,
}: LightboxProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // There is no `document` to portal into while rendering on the server, and
  // hydration has to agree with that before the overlay can appear.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  const close = useCallback(() => {
    // The interception only exists on a soft navigation, so there is always a
    // history entry to pop — except when the modal is the entry point, which
    // React strict-mode double renders and back/forward can produce.
    if (window.history.length > 1) router.back();
    else router.replace(fallbackHref);
  }, [fallbackHref, router]);

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    // Waits for the portal: on the hydration pass there is no panel yet.
    if (!hydrated) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => restoreTo?.focus?.();
  }, [hydrated]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "ArrowLeft" && prevHref) {
        event.preventDefault();
        router.replace(prevHref);
        return;
      }

      if (event.key === "ArrowRight" && nextHref) {
        event.preventDefault();
        router.replace(nextHref);
        return;
      }

      if (event.key !== "Tab") return;

      // Keep focus inside the overlay: the page behind it is still in the DOM.
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, nextHref, prevHref, router]);

  useEffect(() => {
    for (const href of [prevHref, nextHref]) {
      if (href) router.prefetch(href);
    }
  }, [nextHref, prevHref, router]);

  if (!hydrated) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-void/85 p-4 backdrop-blur-sm sm:p-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative my-auto flex w-full max-w-6xl items-center gap-3 outline-none"
      >
        {prevHref ? (
          <Link
            href={prevHref}
            replace
            aria-label="Previous image"
            className={ARROW_CLASS}
          >
            <ArrowIcon />
          </Link>
        ) : (
          <span className="h-11 w-11 shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 pb-3">
            <h2 className="truncate font-display text-lg font-medium text-parchment">
              {title}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment-muted transition hover:border-glow-500/40 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
            >
              <CloseIcon />
            </button>
          </div>

          {children}

          {footer ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {footer}
            </div>
          ) : null}
        </div>

        {nextHref ? (
          <Link href={nextHref} replace aria-label="Next image" className={ARROW_CLASS}>
            <ArrowIcon className="rotate-180" />
          </Link>
        ) : (
          <span className="h-11 w-11 shrink-0" aria-hidden />
        )}
      </div>
    </div>,
    document.body,
  );
}
