import { describe, expect, test } from "bun:test";

import { detectLinkKind } from "@/lib/detectLinkKind";

describe("detectLinkKind", () => {
  test("falls back to website for empty or unknown hosts", () => {
    expect(detectLinkKind("")).toBe("website");
    expect(detectLinkKind("   ")).toBe("website");
    expect(detectLinkKind("https://playwolf.net")).toBe("website");
    expect(detectLinkKind("not a url")).toBe("website");
  });

  test("accepts a URL without a scheme", () => {
    expect(detectLinkKind("twitch.tv/playwolf")).toBe("twitch");
    expect(detectLinkKind("www.youtube.com/@playwolf")).toBe("youtube");
  });

  test("detects twitch and youtube", () => {
    expect(detectLinkKind("https://twitch.tv/playwolf")).toBe("twitch");
    expect(detectLinkKind("https://www.twitch.tv/playwolf")).toBe("twitch");
    expect(detectLinkKind("https://m.twitch.tv/playwolf")).toBe("twitch");
    expect(detectLinkKind("https://www.youtube.com/@playwolf")).toBe("youtube");
    expect(detectLinkKind("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    expect(detectLinkKind("https://music.youtube.com/channel/UC123")).toBe("youtube");
  });

  test("detects the existing social hosts", () => {
    expect(detectLinkKind("https://x.com/playwolf")).toBe("twitter");
    expect(detectLinkKind("https://twitter.com/playwolf")).toBe("twitter");
    expect(detectLinkKind("https://bsky.app/profile/playwolf.net")).toBe("bluesky");
    expect(detectLinkKind("https://instagram.com/playwolf")).toBe("instagram");
    expect(detectLinkKind("https://www.furaffinity.net/user/playwolf")).toBe(
      "furaffinity",
    );
    expect(detectLinkKind("https://vgen.co/playwolf")).toBe("vgen");
    expect(detectLinkKind("https://linktr.ee/playwolf")).toBe("linktree");
    expect(detectLinkKind("https://ko-fi.com/playwolf")).toBe("kofi");
    expect(detectLinkKind("https://www.patreon.com/playwolf")).toBe("patreon");
    expect(detectLinkKind("https://boosty.to/playwolf")).toBe("boosty");
    expect(detectLinkKind("https://trello.com/b/abc/board")).toBe("trello");
    expect(detectLinkKind("https://t.me/playwolf")).toBe("telegram");
    expect(detectLinkKind("https://discord.gg/invite")).toBe("discord");
    expect(detectLinkKind("https://discord.com/users/123")).toBe("discord");
  });

  test("detects email as mailto or a bare address", () => {
    expect(detectLinkKind("mailto:hi@playwolf.net")).toBe("email");
    expect(detectLinkKind("hi@playwolf.net")).toBe("email");
  });
});
