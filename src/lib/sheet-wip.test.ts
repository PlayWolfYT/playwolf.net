import { describe, expect, test } from "bun:test";

import {
  DEFAULT_WIP_ICON_COUNT,
  DEFAULT_WIP_ICONS,
  DEFAULT_WIP_INTERVAL,
  DEFAULT_WIP_QUOTES,
  NSFW_WIP_QUOTES,
} from "@/lib/sheet-wip";

describe("WIP defaults", () => {
  test("both quote pools have something to say", () => {
    expect(DEFAULT_WIP_QUOTES.length).toBeGreaterThan(0);
    expect(NSFW_WIP_QUOTES.length).toBeGreaterThan(0);
  });

  test("no quote repeats within a pool", () => {
    for (const pool of [DEFAULT_WIP_QUOTES, NSFW_WIP_QUOTES]) {
      expect(new Set(pool).size).toBe(pool.length);
    }
  });

  test("the pools do not overlap", () => {
    // An After Dark sheet falls back to the racier pool wholesale, so a quote
    // in both would just be twice as likely to appear there.
    const shared = NSFW_WIP_QUOTES.filter((quote) =>
      (DEFAULT_WIP_QUOTES as readonly string[]).includes(quote),
    );
    expect(shared).toEqual([]);
  });

  test("icon names are the kebab-case lucide vocabulary the picker writes", () => {
    for (const name of DEFAULT_WIP_ICONS) {
      expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(new Set(DEFAULT_WIP_ICONS).size).toBe(DEFAULT_WIP_ICONS.length);
  });

  test("the scatter and the cycle are both usable numbers", () => {
    expect(DEFAULT_WIP_ICON_COUNT).toBeGreaterThan(0);
    expect(DEFAULT_WIP_INTERVAL).toBeGreaterThanOrEqual(1000);
  });
});
