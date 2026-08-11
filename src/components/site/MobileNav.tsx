"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { NAV_ITEMS } from "@/components/site/nav";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hamburger + full-screen menu for viewports below `sm`. The panel is portaled
 * to `document.body` so the header's `backdrop-blur` cannot create a containing
 * block that clips `position: fixed` (a common sticky-header trap).
 *
 * Open state is keyed to the current pathname so a navigation (link tap or
 * browser back) closes the menu without an effect.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
    // Prefer the first nav link; fall back to the in-panel close button.
    const firstLink = focusables.find((el) => el.tagName === "A");
    (firstLink ?? focusables[0])?.focus();

    const button = buttonRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenForPath(null);
        return;
      }

      if (event.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      (previouslyFocused.current ?? button)?.focus();
    };
  }, [open]);

  const close = () => setOpenForPath(null);

  // Portal only after a client click (`open`); never runs during SSR.
  const panel = open
    ? createPortal(
          <div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Primary"
            className="fixed inset-0 z-[60] flex flex-col bg-void pt-[env(safe-area-inset-top)] sm:hidden"
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-4">
              <Link
                href="/"
                onClick={close}
                className="shrink-0 font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500 transition hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
              >
                playwolf.net
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-void-lift/70 text-parchment transition hover:border-glow-500/40 hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
              >
                <MenuIcon open />
              </button>
            </div>

            <nav
              aria-label="Primary"
              className="flex flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
            >
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={close}
                        className={`flex min-h-14 items-center rounded-2xl px-4 text-base font-medium uppercase tracking-[0.2em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${
                          active
                            ? "bg-glow-500/10 text-glow-400"
                            : "text-parchment-dim hover:bg-white/[0.04] hover:text-parchment"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>,
          document.body,
        )
    : null;

  return (
    <div className="sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Menu"}
        onClick={() => setOpenForPath(open ? null : pathname)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment transition hover:border-glow-500/40 hover:text-glow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
      >
        <MenuIcon open={open} />
      </button>
      {panel}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </>
      )}
    </svg>
  );
}
