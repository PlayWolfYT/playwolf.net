import { describe, expect, mock, test } from "bun:test";

import {
  addInterval,
  isReminderDue,
  processCommissionReminders,
} from "@/lib/reminders";
import type { NotifyFn } from "@/lib/reminders";

describe("addInterval", () => {
  test("adds days, weeks, and months in UTC", () => {
    const from = new Date("2026-01-15T12:00:00.000Z");
    expect(addInterval(from, 3, "days").toISOString()).toBe("2026-01-18T12:00:00.000Z");
    expect(addInterval(from, 2, "weeks").toISOString()).toBe(
      "2026-01-29T12:00:00.000Z",
    );
    expect(addInterval(from, 1, "months").toISOString()).toBe(
      "2026-02-15T12:00:00.000Z",
    );
  });
});

describe("isReminderDue", () => {
  const now = new Date("2026-08-10T12:00:00.000Z");

  test("requires enabled and a nextAt at or before now", () => {
    expect(
      isReminderDue({ enabled: true, nextAt: "2026-08-10T11:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isReminderDue({ enabled: true, nextAt: "2026-08-10T12:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isReminderDue({ enabled: true, nextAt: "2026-08-10T13:00:00.000Z" }, now),
    ).toBe(false);
    expect(
      isReminderDue({ enabled: false, nextAt: "2026-08-10T11:00:00.000Z" }, now),
    ).toBe(false);
    expect(isReminderDue({ enabled: true }, now)).toBe(false);
  });
});

describe("processCommissionReminders", () => {
  test("notifies due artworks and advances nextAt / lastSentAt", async () => {
    const now = new Date("2026-08-10T12:00:00.000Z");
    const updates: unknown[] = [];

    const notifyFn = mock<NotifyFn>(async () => ({
      ok: true,
      via: ["ntfy"],
      errors: [],
    }));

    const payload = {
      findGlobal: async () => ({
        notifications: {
          channel: "ntfy",
          ntfy: { serverUrl: "https://ntfy.sh", topic: "t" },
        },
      }),
      find: async () => ({
        docs: [
          {
            id: 7,
            title: "Sketch",
            slug: "sketch",
            profile: "sfw",
            reminder: {
              enabled: true,
              interval: 2,
              unit: "weeks",
              nextAt: "2026-08-01T00:00:00.000Z",
            },
            character: { name: "Wuff", slug: "wuff" },
          },
        ],
      }),
      update: async (args: unknown) => {
        updates.push(args);
        return {};
      },
    };

    const result = await processCommissionReminders(payload as never, notifyFn, now);

    expect(result).toEqual({ sent: 1, errors: [] });
    expect(notifyFn).toHaveBeenCalledTimes(1);
    expect(updates).toHaveLength(1);
    const update = updates[0] as {
      id: number;
      data: { reminder: { nextAt: string; lastSentAt: string; interval: number } };
    };
    expect(update.id).toBe(7);
    expect(update.data.reminder.lastSentAt).toBe(now.toISOString());
    expect(update.data.reminder.nextAt).toBe(
      addInterval(now, 2, "weeks").toISOString(),
    );
  });

  test("records notify failures without updating the document", async () => {
    const notifyFn: NotifyFn = async () => ({
      ok: false,
      via: [],
      errors: ["ntfy: down"],
    });

    const payload = {
      findGlobal: async () => ({ notifications: { channel: "ntfy" } }),
      find: async () => ({
        docs: [
          {
            id: 1,
            title: "X",
            slug: "x",
            profile: "sfw",
            reminder: {
              enabled: true,
              interval: 1,
              unit: "days",
              nextAt: "2020-01-01T00:00:00.000Z",
            },
          },
        ],
      }),
      update: async () => {
        throw new Error("should not update");
      },
    };

    const result = await processCommissionReminders(
      payload as never,
      notifyFn,
      new Date("2026-08-10T12:00:00.000Z"),
    );

    expect(result.sent).toBe(0);
    expect(result.errors[0]).toContain("ntfy: down");
  });
});
