import { describe, expect, test } from "bun:test";

import {
  buildNtfyHeaders,
  buildNtfyUrl,
  isNtfyConfigured,
  isSmtpConfigured,
  resolveNotifyChannels,
  sendNotification,
} from "@/lib/notify";

describe("buildNtfyUrl", () => {
  test("joins server and topic, trimming trailing slashes", () => {
    expect(buildNtfyUrl("https://ntfy.sh/", "playwolf")).toBe(
      "https://ntfy.sh/playwolf",
    );
  });

  test("encodes topic segments", () => {
    expect(buildNtfyUrl("https://ntfy.sh", "a/b")).toBe("https://ntfy.sh/a%2Fb");
  });

  test("returns undefined when either part is missing", () => {
    expect(buildNtfyUrl("", "topic")).toBeUndefined();
    expect(buildNtfyUrl("https://ntfy.sh", "")).toBeUndefined();
    expect(buildNtfyUrl(null, "topic")).toBeUndefined();
  });
});

describe("resolveNotifyChannels", () => {
  test("ntfy mode only returns ntfy when configured", () => {
    expect(resolveNotifyChannels("ntfy", { ntfy: true, smtp: true })).toEqual(["ntfy"]);
    expect(resolveNotifyChannels("ntfy", { ntfy: false, smtp: true })).toEqual([]);
  });

  test("smtp mode only returns smtp when configured", () => {
    expect(resolveNotifyChannels("smtp", { ntfy: true, smtp: true })).toEqual(["smtp"]);
  });

  test("both tries every configured channel; ntfy missing falls back to smtp", () => {
    expect(resolveNotifyChannels("both", { ntfy: true, smtp: true })).toEqual([
      "ntfy",
      "smtp",
    ]);
    expect(resolveNotifyChannels("both", { ntfy: false, smtp: true })).toEqual([
      "smtp",
    ]);
    expect(resolveNotifyChannels("both", { ntfy: true, smtp: false })).toEqual([
      "ntfy",
    ]);
  });
});

describe("buildNtfyHeaders", () => {
  test("sets Title, optional Priority and Bearer token", () => {
    expect(
      buildNtfyHeaders({ title: "Hello", message: "body", priority: 4 }, "secret"),
    ).toEqual({
      Title: "Hello",
      Priority: "4",
      Authorization: "Bearer secret",
    });
  });
});

describe("configuration helpers", () => {
  test("detects ntfy and smtp readiness", () => {
    expect(isNtfyConfigured({ serverUrl: "https://ntfy.sh", topic: "t" })).toBe(true);
    expect(isSmtpConfigured({ host: "mail", from: "a@b.c", to: "d@e.f" })).toBe(true);
    expect(isSmtpConfigured({ host: "mail", from: "a@b.c" })).toBe(false);
  });
});

describe("sendNotification", () => {
  test("posts to ntfy with the expected URL and headers", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response("ok", { status: 200 });
    };

    const result = await sendNotification(
      {
        channel: "ntfy",
        ntfy: {
          serverUrl: "https://ntfy.sh",
          topic: "playwolf",
          token: "tok",
        },
      },
      { title: "Ping", message: "hello", priority: 2 },
      fetchImpl,
    );

    expect(result).toEqual({ ok: true, via: ["ntfy"], errors: [] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://ntfy.sh/playwolf");
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.body).toBe("hello");
    expect(calls[0].init.headers).toEqual({
      Title: "Ping",
      Priority: "2",
      Authorization: "Bearer tok",
    });
  });

  test("posts over plain http when the server is loopback", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      calls.push(String(url));
      return new Response("ok", { status: 200 });
    };

    const result = await sendNotification(
      {
        channel: "ntfy",
        ntfy: { serverUrl: "http://localhost:8080", topic: "playwolf", token: "tok" },
      },
      { title: "Ping", message: "hello" },
      fetchImpl,
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual(["http://localhost:8080/playwolf"]);
  });

  // The field `validate` on `serverUrl` only runs on save, so a plaintext URL
  // stored before that check existed would still be sent to.
  test("refuses a plaintext non-loopback server instead of sending the token", async () => {
    let requested = false;
    const fetchImpl: typeof fetch = async () => {
      requested = true;
      return new Response("ok", { status: 200 });
    };

    const result = await sendNotification(
      {
        channel: "ntfy",
        ntfy: { serverUrl: "http://ntfy.sh", topic: "playwolf", token: "tok" },
      },
      { title: "Ping", message: "hello" },
      fetchImpl,
    );

    expect(requested).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("https");
  });

  test("reports an error when nothing is configured", async () => {
    const result = await sendNotification(
      { channel: "both" },
      { title: "x", message: "y" },
      async () => new Response("nope", { status: 500 }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("No notification channel");
  });
});
