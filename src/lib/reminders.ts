import type { Payload } from "payload";

import {
  sendNotification,
  type NotifyInput,
  type NotifyResult,
  type NotifySettings,
} from "@/lib/notify";

export type ReminderUnit = "days" | "weeks" | "months";

export type ReminderState = {
  enabled?: boolean | null;
  interval?: number | null;
  unit?: ReminderUnit | null;
  nextAt?: string | null;
  lastSentAt?: string | null;
};

/** Add a calendar interval. Months use calendar months (same day-of-month). */
export function addInterval(from: Date, interval: number, unit: ReminderUnit): Date {
  const next = new Date(from.getTime());
  const amount = Number.isFinite(interval) && interval > 0 ? interval : 1;

  switch (unit) {
    case "days":
      next.setUTCDate(next.getUTCDate() + amount);
      break;
    case "weeks":
      next.setUTCDate(next.getUTCDate() + amount * 7);
      break;
    case "months":
      next.setUTCMonth(next.getUTCMonth() + amount);
      break;
  }

  return next;
}

/** True when reminders are on and `nextAt` is at or before `now`. */
export function isReminderDue(
  reminder: ReminderState | null | undefined,
  now: Date,
): boolean {
  if (!reminder?.enabled) return false;
  if (!reminder.nextAt) return false;
  const nextAt = new Date(reminder.nextAt);
  if (Number.isNaN(nextAt.getTime())) return false;
  return nextAt.getTime() <= now.getTime();
}

export type NotifyFn = (
  settings: NotifySettings,
  input: NotifyInput,
) => Promise<NotifyResult>;

type ReminderArtwork = {
  id: number;
  title: string;
  slug: string;
  profile: "sfw" | "nsfw";
  reminder?: ReminderState | null;
  character?:
    number | { id?: number; name?: string | null; slug?: string | null } | null;
};

function characterLabel(character: ReminderArtwork["character"]): string {
  if (character && typeof character === "object") {
    return character.name || character.slug || "character";
  }
  return "character";
}

/**
 * Find due in-progress commission reminders, notify, and advance `nextAt`.
 * Uses `overrideAccess` so cron can read authenticated-only reminder fields.
 */
export async function processCommissionReminders(
  payload: Payload,
  notifyFn: NotifyFn = sendNotification,
  now: Date = new Date(),
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  const settings = await payload.findGlobal({
    slug: "siteSettings",
    depth: 0,
    overrideAccess: true,
  });

  const due = await payload.find({
    collection: "artworks",
    where: {
      and: [
        { lifecycle: { equals: "in_progress" } },
        { "reminder.enabled": { equals: true } },
        { "reminder.nextAt": { less_than_equal: now.toISOString() } },
      ],
    },
    depth: 1,
    limit: 100,
    overrideAccess: true,
  });

  for (const artwork of due.docs as ReminderArtwork[]) {
    if (!isReminderDue(artwork.reminder, now)) continue;

    const interval = artwork.reminder?.interval ?? 1;
    const unit = artwork.reminder?.unit ?? "weeks";
    const subject = characterLabel(artwork.character);

    try {
      const result = await notifyFn(settings.notifications, {
        title: `Commission reminder: ${artwork.title}`,
        message: `"${artwork.title}" (${subject}/${artwork.profile}) is still in progress. Check in with the artist.`,
        priority: 3,
      });

      if (!result.ok) {
        errors.push(
          `${artwork.slug}: ${result.errors.join("; ") || "notification failed"}`,
        );
        continue;
      }

      const nextAt = addInterval(now, interval, unit).toISOString();
      await payload.update({
        collection: "artworks",
        id: artwork.id,
        data: {
          reminder: {
            ...artwork.reminder,
            enabled: true,
            interval,
            unit,
            lastSentAt: now.toISOString(),
            nextAt,
          },
        },
        overrideAccess: true,
        context: { disableRevalidate: true },
      });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${artwork.slug}: ${message}`);
    }
  }

  return { sent, errors };
}
