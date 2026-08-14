import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { PATHNAME_HEADER } from "@/lib/maintenance";

/**
 * Runs on every request that is not a static asset. Three jobs, in order:
 *
 * 1. Rate-limit the few endpoints where an unauthenticated caller can cost
 *    something — an admin lockout, an email, a push notification.
 * 2. Attach a Content-Security-Policy. This cannot live in `next.config.ts`:
 *    the analytics origin is deliberately runtime-only (see
 *    `src/components/site/Analytics.tsx`) while `headers()` there is baked at
 *    build time, and the site and the Payload admin need different policies,
 *    which only a per-request hook can tell apart.
 * 3. Forward the request pathname so the frontend template can honour
 *    maintenance-mode path exclusions. Maintenance itself is decided in
 *    `app/(frontend)/template.tsx` (where site settings are loaded), which
 *    remounts on every soft navigation.
 *
 * A proxy always runs on the Node.js runtime, which is what lets the env read
 * below happen at runtime and the counters below survive between requests.
 */

const MINUTE = 60_000;

type RateRule = {
  /** Matched exactly, or as a path-segment prefix. */
  prefix: string;
  limit: number;
  windowMs: number;
};

const RATE_RULES: readonly RateRule[] = [
  /**
   * Deliberately below `Users.auth.maxLoginAttempts` (8) across the same
   * `lockTime` (10 minutes). The real risk on this endpoint is not a guessed
   * password but an attacker spending the lockout budget to keep the sole
   * operator out, and `unlock` is `authenticated`, so there is no in-app
   * recovery — locking the account is the whole attack. One peer can now no
   * longer reach the lock threshold on its own.
   */
  { prefix: "/api/users/login", limit: 5, windowMs: 10 * MINUTE },
  /** Sends mail, and doubles as an account-enumeration probe. */
  { prefix: "/api/users/forgot-password", limit: 3, windowMs: 15 * MINUTE },
  /** Bearer-authenticated and scheduled daily; one call is all a real one needs. */
  { prefix: "/api/cron", limit: 6, windowMs: MINUTE },
  /** Pushes a real ntfy message or email on every call. */
  {
    prefix: "/api/globals/siteSettings/test-notification",
    limit: 5,
    windowMs: 5 * MINUTE,
  },
];

type CountedWindow = { count: number; resetAt: number };

/**
 * One process, one map: the app runs as a single container behind NPM, so
 * in-memory counters are enough and cost nothing. Scaling to more than one
 * instance would make these per-instance and need shared state instead.
 *
 * The windows are fixed rather than sliding, so a burst straddling a boundary
 * can briefly spend two windows' allowance. That is enough to trip the login
 * lock once, not to hold it — the next window is another ten minutes out.
 */
const windows = new Map<string, CountedWindow>();
const MAX_TRACKED_KEYS = 10_000;

function dropExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/** Seconds to wait when the caller is over its limit, or `null` when it is not. */
function consume(rule: RateRule, client: string): number | null {
  const now = Date.now();
  const key = `${rule.prefix} ${client}`;
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    // Only sweep when the map is actually growing; rotating spoofed keys are
    // the only way to get there, and they must not be able to grow it forever.
    if (windows.size >= MAX_TRACKED_KEYS) dropExpired(now);
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  current.count += 1;
  if (current.count <= rule.limit) return null;
  return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
}

/**
 * TLS terminates at Nginx Proxy Manager, so the peer address only arrives in a
 * forwarded header. `X-Real-IP` is the one NPM overwrites with the connecting
 * address on every proxied location. `X-Forwarded-For` is *appended* to, so
 * only its last hop is ours — keying on the first hop would let a caller rotate
 * a fabricated value and walk straight past the limiter.
 */
function clientKey(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const hops = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  return hops.at(-1) ?? "unknown";
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function analyticsOrigin(): string | null {
  const src = process.env.UMAMI_SCRIPT_URL;
  if (!src || !process.env.UMAMI_WEBSITE_ID) return null;
  try {
    return new URL(src).origin;
  } catch {
    return null;
  }
}

type Policies = { admin: string; site: string };

/**
 * Built once per process, on the first request rather than at module load, so
 * the env read stays a runtime one.
 */
let policies: Policies | null = null;

function buildPolicies(): Policies {
  const isDev = process.env.NODE_ENV !== "production";
  const analytics = analyticsOrigin();

  /**
   * Both `'unsafe-inline'` values are load-bearing today: Next inlines its
   * bootstrap and streams RSC payloads through inline `<script>` tags, and
   * Payload's admin styles elements inline. Removing either needs a nonce
   * pipeline, which is the prerequisite for promoting this header from
   * report-only to enforcing.
   */
  const script = ["'self'", "'unsafe-inline'"];
  const style = ["'self'", "'unsafe-inline'"];
  const connect = ["'self'"];
  // Media is served same-origin from `/api/{collection}/file/…`; `blob:` and
  // `data:` cover the crop drawer's object URLs and the blur placeholders.
  const img = ["'self'", "data:", "blob:"];

  if (isDev) {
    // Turbopack's HMR client evaluates modules and talks over a websocket.
    script.push("'unsafe-eval'");
    connect.push("ws:");
  }

  if (analytics) {
    script.push(analytics);
    connect.push(analytics);
  }

  // Only set when Garage is exposed directly instead of proxied (see
  // `docs/DEPLOYMENT.md` section 6.3), in which case media is cross-origin.
  const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_URL;
  if (mediaOrigin) {
    try {
      img.push(new URL(mediaOrigin).origin);
    } catch {
      // A malformed value is the deployment's problem, not a reason to ship no
      // policy at all.
    }
  }

  const shared = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Unfurlers read metadata rather than framing the page, so this does not
    // affect how NSFW artwork embeds in Discord or Telegram.
    "frame-ancestors 'self'",
    "object-src 'none'",
    "font-src 'self' data:",
    `style-src ${style.join(" ")}`,
    `script-src ${script.join(" ")}`,
  ];

  return {
    site: [
      ...shared,
      `img-src ${img.join(" ")}`,
      `connect-src ${connect.join(" ")}`,
    ].join("; "),
    admin: [
      ...shared,
      /**
       * Identical to the site's today: `admin.avatar: "default"` in the Payload
       * config keeps the signed-in user's avatar local, so the admin no longer
       * needs an external image origin (and no longer leaks an email hash to
       * Gravatar on every page load).
       */
      `img-src ${img.join(" ")}`,
      // The admin re-fetches the object URLs it creates for crop previews.
      `connect-src ${[...connect, "blob:"].join(" ")}`,
    ].join("; "),
  };
}

function cspFor(pathname: string): string {
  policies ??= buildPolicies();
  return isUnder(pathname, "/admin") ? policies.admin : policies.site;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rule = RATE_RULES.find((candidate) => isUnder(pathname, candidate.prefix));
  if (rule) {
    const retryAfter = consume(rule, clientKey(request));
    if (retryAfter !== null) {
      // Payload's error shape, so the admin UI surfaces the message as-is.
      return NextResponse.json(
        { errors: [{ message: "Too many requests. Please try again shortly." }] },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  const requestHeaders = new Headers(request.headers);
  // A client is free to send its own `x-pathname`, and everything downstream
  // treats this header as the real path. Dropping it before writing keeps that
  // true no matter how the value is written afterwards.
  requestHeaders.delete(PATHNAME_HEADER);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  /**
   * Report-only on purpose. The policy is one nonce pipeline short of being
   * safe to enforce, and a mistake here would take the admin down rather than
   * degrade it. Promote to `Content-Security-Policy` only after the admin's
   * Lexical toolbar, gradient panel, colour picker and crop drawer have been
   * exercised with a clean console.
   */
  response.headers.set("Content-Security-Policy-Report-Only", cspFor(pathname));

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and files with an extension (favicons, images, etc.).
     * Admin/API also get the header; they do not use the frontend layout.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
