"use client";

import { usePathname } from "next/navigation";
import { accentVars } from "@/lib/accent";
import { isProfileKey, type AccentMap, type ProfileKey } from "@/lib/content";

/**
 * Derive the active character + profile from a /ref pathname.
 * Shapes: /ref, /ref/<char>, /ref/<char>/<sfw|nsfw>, /ref/<char>/<sfw|nsfw>/<slug>.
 */
function parseRefPath(
  pathname: string,
): { characterSlug: string; profileKey: ProfileKey } | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "ref" || segments.length < 2) return null;

  const characterSlug = segments[1];
  const profileSegment = segments[2];
  return {
    characterSlug,
    profileKey: profileSegment && isProfileKey(profileSegment) ? profileSegment : "sfw",
  };
}

/**
 * Client wrapper around the whole /ref shell. Reads the active character +
 * profile from the URL and applies that profile's accent ramp as inline CSS
 * variables, re-theming every `glow-*` utility underneath — header and footer
 * included, which is why it wraps them rather than sitting inside `<main>`.
 *
 * Colours come from the server-built `accentMap` prop (see `getAccentMap`) so
 * this client component never pulls the content layer into the browser bundle.
 * `usePathname()` resolves during rendering, so the HTML already carries the
 * right colours and there is no flash on navigation. Unknown characters and
 * `/ref` itself fall back to the root brand accent.
 */
export function RefThemeShell({
  accentMap,
  children,
}: Readonly<{ accentMap: AccentMap; children: React.ReactNode }>) {
  const pathname = usePathname();
  const parsed = parseRefPath(pathname);
  const characterAccents = parsed ? accentMap[parsed.characterSlug] : undefined;
  // Fall back to the character's first profile accent when the implied
  // profile doesn't exist (e.g. /ref/<char> for an NSFW-only character).
  const accent =
    parsed && characterAccents
      ? (characterAccents[parsed.profileKey] ?? Object.values(characterAccents)[0])
      : undefined;

  return (
    <div
      className="relative isolate flex min-h-dvh flex-col bg-background"
      style={accent ? (accentVars(accent) as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
