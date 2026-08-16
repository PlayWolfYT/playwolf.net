import { EMAIL_ADDRESS } from "@/lib/safe-url";
import type { LinkKind } from "@/payload/fields/links";

/**
 * Host suffixes for every kind that is a website. `email` is handled separately
 * (mailto / bare address); `website` is the fallback when nothing matches.
 *
 * Matching is suffix-based so `www.`, `m.`, `music.` and similar prefixes all
 * resolve. Keep this exhaustive — adding a `LinkKind` without an entry here is
 * a type error.
 */
const HOSTS: Record<Exclude<LinkKind, "website" | "email">, readonly string[]> = {
  twitter: ["twitter.com", "x.com"],
  bluesky: ["bsky.app", "bsky.social"],
  instagram: ["instagram.com", "instagr.am"],
  twitch: ["twitch.tv"],
  youtube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  furaffinity: ["furaffinity.net"],
  vgen: ["vgen.co"],
  linktree: ["linktr.ee", "linktree.com"],
  kofi: ["ko-fi.com"],
  patreon: ["patreon.com"],
  boosty: ["boosty.to"],
  trello: ["trello.com"],
  telegram: ["t.me", "telegram.me", "telegram.org"],
  discord: ["discord.gg", "discord.com", "discordapp.com"],
};

function hostMatches(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function parseCandidate(raw: string): URL | undefined {
  try {
    return new URL(raw);
  } catch {
    try {
      return new URL(`https://${raw}`);
    } catch {
      return undefined;
    }
  }
}

/**
 * Best-effort platform from a pasted URL or email. Unknown hosts (and empty
 * input) fall through to `website` so the admin select still has a value.
 */
export function detectLinkKind(raw: string): LinkKind {
  const trimmed = raw.trim();
  if (!trimmed) return "website";

  if (/^mailto:/i.test(trimmed) || EMAIL_ADDRESS.test(trimmed)) return "email";

  const url = parseCandidate(trimmed);
  if (!url) return "website";
  if (url.protocol === "mailto:") return "email";

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();

  for (const [kind, suffixes] of Object.entries(HOSTS) as [
    Exclude<LinkKind, "website" | "email">,
    readonly string[],
  ][]) {
    if (suffixes.some((suffix) => hostMatches(hostname, suffix))) return kind;
  }

  return "website";
}
