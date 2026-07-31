import { describe, expect, test } from "bun:test";

import { isNsfwLocation, nsfwExitHref } from "@/lib/nsfw";

describe("isNsfwLocation", () => {
  test("matches every After Dark route", () => {
    expect(isNsfwLocation("/ref/playwuff/nsfw")).toBe(true);
    expect(isNsfwLocation("/ref/playwuff/nsfw/")).toBe(true);
    expect(isNsfwLocation("/ref/playwuff/nsfw/backshots")).toBe(true);
  });

  test("leaves the rest of a character's pages alone", () => {
    expect(isNsfwLocation("/ref")).toBe(false);
    expect(isNsfwLocation("/ref/playwuff")).toBe(false);
    expect(isNsfwLocation("/ref/playwuff/sfw")).toBe(false);
    expect(isNsfwLocation("/ref/playwuff/sfw/maw")).toBe(false);
  });

  test("matches the gallery only with the 18+ filter switched on", () => {
    expect(isNsfwLocation("/gallery")).toBe(false);
    expect(isNsfwLocation("/gallery", "?artist=deathlightk")).toBe(false);
    expect(isNsfwLocation("/gallery", "?nsfw=1")).toBe(true);
    expect(isNsfwLocation("/gallery", "?artist=deathlightk&nsfw=1")).toBe(true);
  });

  test("accepts the params object `useSearchParams()` returns", () => {
    expect(isNsfwLocation("/gallery", new URLSearchParams({ nsfw: "1" }))).toBe(true);
    expect(isNsfwLocation("/gallery", new URLSearchParams())).toBe(false);
  });

  test("ignores the query string outside the gallery", () => {
    expect(isNsfwLocation("/about", "?nsfw=1")).toBe(false);
    expect(isNsfwLocation("/", "?nsfw=1")).toBe(false);
  });
});

describe("nsfwExitHref", () => {
  test("stays in the section the visitor was refused from", () => {
    expect(nsfwExitHref("/ref/playwuff/nsfw/backshots")).toBe("/ref");
    expect(nsfwExitHref("/gallery")).toBe("/gallery");
    expect(nsfwExitHref("/")).toBe("/");
  });
});
