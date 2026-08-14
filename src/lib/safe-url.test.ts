import { describe, expect, test } from "bun:test";

import {
  isEmailAddress,
  isHttpUrl,
  isSafeHref,
  isSecureUrl,
  safeHref,
} from "@/lib/safe-url";

describe("isSafeHref", () => {
  test("allows the web and contact schemes", () => {
    expect(isSafeHref("https://playwolf.net")).toBe(true);
    expect(isSafeHref("http://playwolf.net")).toBe(true);
    expect(isSafeHref("mailto:hi@playwolf.net")).toBe(true);
    expect(isSafeHref("tel:+123456789")).toBe(true);
  });

  test("allows relative and protocol-relative hrefs", () => {
    expect(isSafeHref("/gallery")).toBe(true);
    expect(isSafeHref("#top")).toBe(true);
    expect(isSafeHref("//playwolf.net/gallery")).toBe(true);
  });

  test("rejects script-bearing and unknown schemes", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("JAVASCRIPT:alert(1)")).toBe(false);
    expect(isSafeHref("  javascript:alert(1)")).toBe(false);
    // Browsers strip control characters inside the scheme before navigating.
    expect(isSafeHref("java\tscript:alert(1)")).toBe(false);
    expect(isSafeHref("java\nscript:alert(1)")).toBe(false);
    expect(isSafeHref("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHref("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHref("file:///etc/passwd")).toBe(false);
  });

  test("rejects non-strings and blanks", () => {
    expect(isSafeHref(undefined)).toBe(false);
    expect(isSafeHref(null)).toBe(false);
    expect(isSafeHref(42)).toBe(false);
    expect(isSafeHref("   ")).toBe(false);
  });

  test("safeHref returns the trimmed value or undefined", () => {
    expect(safeHref("  https://playwolf.net  ")).toBe("https://playwolf.net");
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
  });
});

describe("isHttpUrl", () => {
  test("requires an absolute http(s) URL", () => {
    expect(isHttpUrl("https://t.me/playwolf")).toBe(true);
    expect(isHttpUrl("http://playwolf.net")).toBe(true);
    expect(isHttpUrl("playwolf.net")).toBe(false);
    expect(isHttpUrl("/gallery")).toBe(false);
    expect(isHttpUrl("mailto:hi@playwolf.net")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("isEmailAddress", () => {
  test("accepts a bare address only", () => {
    expect(isEmailAddress("hi@playwolf.net")).toBe(true);
    expect(isEmailAddress("  hi@playwolf.net ")).toBe(true);
    expect(isEmailAddress("mailto:hi@playwolf.net")).toBe(false);
    expect(isEmailAddress("hi@playwolf")).toBe(false);
    expect(isEmailAddress("playwolf.net")).toBe(false);
  });
});

describe("isSecureUrl", () => {
  test("accepts https anywhere", () => {
    expect(isSecureUrl("https://ntfy.sh")).toBe(true);
    expect(isSecureUrl("https://ntfy.playwolf.net/topic")).toBe(true);
  });

  test("accepts http only on loopback", () => {
    expect(isSecureUrl("http://localhost:8080")).toBe(true);
    expect(isSecureUrl("http://ntfy.localhost")).toBe(true);
    expect(isSecureUrl("http://127.0.0.1:8080")).toBe(true);
    expect(isSecureUrl("http://[::1]:8080")).toBe(true);
    expect(isSecureUrl("http://ntfy.sh")).toBe(false);
    expect(isSecureUrl("http://192.168.1.10")).toBe(false);
  });

  test("rejects anything that is not a URL", () => {
    expect(isSecureUrl("ntfy.sh")).toBe(false);
    expect(isSecureUrl("")).toBe(false);
  });
});
