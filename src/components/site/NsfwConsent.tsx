"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  isNsfwLocation,
  nsfwExitHref,
  NSFW_CONSENT_COOKIE,
  NSFW_CONSENT_MAX_AGE,
} from "@/lib/nsfw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type NsfwConsentValue = {
  consented: boolean;
  /**
   * Shows the warning if it has not been accepted yet. Resolves `true` once
   * 18+ content may be shown, `false` if the visitor backed out.
   */
  confirmNsfw: () => Promise<boolean>;
};

/** Outside the provider nothing is gated — the caller just proceeds. */
const NsfwConsentContext = createContext<NsfwConsentValue>({
  consented: true,
  confirmNsfw: () => Promise.resolve(true),
});

export function useNsfwConsent(): NsfwConsentValue {
  return useContext(NsfwConsentContext);
}

type PendingPrompt = {
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * One-time 18+ warning for the whole site, in place of blurring the artwork
 * itself. Two ways in:
 *
 * - Following a link into 18+ territory. A capture-phase listener catches the
 *   click before the router sees it, so the visitor never lands on the page
 *   unless they agree.
 * - Loading such a URL directly (a link shared elsewhere). `initialConsent`
 *   comes from the cookie on the server, so the warning is part of the first
 *   HTML and the artwork behind it is never uncovered.
 *
 * Declining sends them back where they came from.
 */
export function NsfwConsentProvider({
  initialConsent,
  children,
}: {
  initialConsent: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(initialConsent);
  const [prompt, setPrompt] = useState<PendingPrompt | null>(null);

  const grant = useCallback(() => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${NSFW_CONSENT_COOKIE}=1; Path=/; Max-Age=${NSFW_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
    setConsented(true);
  }, []);

  const leave = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace(nsfwExitHref(pathname));
  }, [pathname, router]);

  const confirmNsfw = useCallback(() => {
    if (consented) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      setPrompt({
        onAccept: () => {
          grant();
          setPrompt(null);
          resolve(true);
        },
        onDecline: () => {
          setPrompt(null);
          resolve(false);
        },
      });
    });
  }, [consented, grant]);

  // Derived during render rather than kept in state: on a direct load this is
  // already true on the server, which is what keeps the warning in the initial
  // HTML instead of appearing a frame after the artwork.
  const blocked = !consented && isNsfwLocation(pathname, searchParams);

  useEffect(() => {
    if (consented) return;

    function onClick(event: MouseEvent) {
      // Modified clicks open a new tab or download the target; let them
      // through, the destination gates itself on load anyway.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!isNsfwLocation(url.pathname, url.search)) return;

      event.preventDefault();
      // React listens on the app root, below `document`, so stopping here is
      // what keeps `<Link>` from navigating behind the warning.
      event.stopPropagation();

      void confirmNsfw().then((accepted) => {
        if (accepted) router.push(`${url.pathname}${url.search}`);
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [confirmNsfw, consented, router]);

  return (
    <NsfwConsentContext.Provider value={{ consented, confirmNsfw }}>
      {children}
      {blocked ? (
        <NsfwWarning onAccept={grant} onDecline={leave} />
      ) : prompt ? (
        <NsfwWarning onAccept={prompt.onAccept} onDecline={prompt.onDecline} />
      ) : null}
    </NsfwConsentContext.Provider>
  );
}

/**
 * Rendered as a plain fixed overlay rather than a portal: a portal needs a
 * `document` to mount into, which would push the warning past the server
 * render and let the page behind it flash into view first.
 */
function NsfwWarning({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onDecline();
        return;
      }

      if (event.key !== "Tab") return;

      // The page is still behind the overlay and still tabbable, so keep focus
      // in here until the visitor has answered.
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
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto overscroll-contain bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl sm:p-8 sm:pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-[max(2rem,env(safe-area-inset-top))]">
      <Card
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="relative my-auto w-full max-w-md [--card-spacing:--spacing(6)] outline-hidden sm:[--card-spacing:--spacing(8)]"
      >
        <CardHeader className="items-center text-center">
          <Badge variant="destructive">18+ / adult content</Badge>
          <CardTitle
            id={titleId}
            className="mt-4 text-3xl font-bold tracking-[-0.055em]"
          >
            Adult content ahead
          </CardTitle>
          <CardDescription
            id={bodyId}
            className="mx-auto mt-2 max-w-sm leading-relaxed"
          >
            This part of the site holds artwork meant for adults. Continue only if you
            are 18 or older and happy to see it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onDecline}
              className="flex-1"
            >
              Take me back
            </Button>
            <Button type="button" size="lg" onClick={onAccept} className="flex-1">
              Yes, I am 18 or older
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-xs text-muted-foreground">
            Remembered on this device so you are only asked once.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
