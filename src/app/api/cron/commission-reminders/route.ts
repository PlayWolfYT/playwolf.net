import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { Payload } from "payload";

import { getPayloadClient } from "@/lib/payload";
import { processCommissionReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Nothing here is cacheable, and the request carries a shared secret. */
const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Constant-time secret comparison. Hashing first is what makes it constant-time
 * in practice: `timingSafeEqual` throws on unequal lengths, so the obvious guard
 * in front of it would leak the secret's length one request at a time. Two
 * SHA-256 digests are always 32 bytes, so neither the length nor the position of
 * the first differing byte is observable.
 */
function secretsMatch(candidate: string, secret: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(candidate), digest(secret));
}

/**
 * An unset `CRON_SECRET` closes the endpoint rather than opening it — but it
 * also means reminders never fire, with nothing to show for it. `CRON_SECRET` is
 * therefore a hard `${VAR:?}` requirement in `docker-compose.yml`, so a stack
 * cannot start into that state; see docs/DEPLOYMENT.md section 15.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  if (bearer !== null && secretsMatch(bearer, `Bearer ${secret}`)) return true;

  const header = request.headers.get("x-cron-secret");
  return header !== null && secretsMatch(header, secret);
}

/**
 * Reminders that are switched on but carry no `nextAt` at all.
 *
 * The due query in `processCommissionReminders` selects on `nextAt <= now`, and
 * SQL never matches NULL, so such a document is not deferred — it can never
 * come due, and it appears in no count the run produces. `Artworks`'
 * `beforeChange` fills the date whenever reminders are enabled through Payload,
 * so reaching this state takes a write that bypasses the hook (a direct SQL
 * edit, a restore from a hand-edited dump). Rare, permanent, and previously
 * invisible: worth one count query per run.
 *
 * Deliberately a second query in the caller rather than a change to
 * `processCommissionReminders`: sending is that function's job, and reporting on
 * the health of the schedule is this route's.
 *
 * The adjacent case this does *not* cover: a `nextAt` that the due query
 * returned but `isReminderDue` then rejected as unparseable. That branch is
 * unreachable through Postgres — `reminder_next_at` is `timestamp(3) with time
 * zone`, so an unparseable value cannot be stored — and catching it would mean
 * counting skips inside the loop in `src/lib/reminders.ts`, which is where that
 * fix belongs if the column type ever changes.
 */
async function countStuckReminders(payload: Payload): Promise<number> {
  const stuck = await payload.find({
    collection: "artworks",
    where: {
      and: [
        { lifecycle: { equals: "in_progress" } },
        { "reminder.enabled": { equals: true } },
        { "reminder.nextAt": { exists: false } },
      ],
    },
    depth: 0,
    limit: 1,
    // `reminder` is an authenticated-only field group, and cron has no user.
    overrideAccess: true,
  });

  return stuck.totalDocs;
}

async function handle(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  const payload = await getPayloadClient();
  const result = await processCommissionReminders(payload);
  const errors = [...result.errors];

  try {
    const stuck = await countStuckReminders(payload);
    if (stuck > 0) {
      errors.push(
        `${stuck} reminder(s) are enabled with no next date and can never come due`,
      );
    }
  } catch (error) {
    errors.push(
      `stuck-reminder check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  /**
   * `ok` answers "did this run leave anything undone", not "did every send
   * succeed". Three things clear it, and `errors` says which: a notification
   * that failed, a backlog `processCommissionReminders` deferred past its page
   * size, and a reminder stuck with no next date.
   *
   * A deferred backlog is a partial success in the sense that nothing was lost —
   * those documents keep their old `nextAt` and are picked up by the next run —
   * yet it still means the schedule is not keeping up, which is an operator
   * problem. Grouping it with the failures costs a spurious investigation on the
   * rare run that overflows; splitting it would let a dead notification channel
   * report success indefinitely, which is the silent failure this endpoint
   * exists to avoid.
   *
   * The status code follows `ok` for the same reason: a scheduled `curl -fsS`
   * has to fail on its own, without the operator remembering to assert on the
   * body. Re-running is safe — every reminder that succeeded already advanced
   * its `nextAt` and will not fire twice.
   */
  const ok = errors.length === 0;

  return NextResponse.json(
    { ok, sent: result.sent, errors },
    { status: ok ? 200 : 500, headers: NO_STORE },
  );
}

/**
 * `POST` is the verb to schedule — the run sends notifications and writes to
 * every document it touches. `GET` stays for parity with the documented
 * `curl` in AGENTS.md and for poking at it by hand; both are rate-limited in
 * `src/proxy.ts` and neither is cacheable.
 */
export function GET(request: Request): Promise<NextResponse> {
  return handle(request);
}

export function POST(request: Request): Promise<NextResponse> {
  return handle(request);
}
