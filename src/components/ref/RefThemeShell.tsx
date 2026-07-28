"use client";

import { usePathname } from "next/navigation";
import { accentVars } from "@/lib/accent";
import {
  isProfileKey,
  type AccentMap,
  type ProfileKey,
} from "@/lib/references";

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
    profileKey:
      profileSegment && isProfileKey(profileSegment) ? profileSegment : "sfw",
  };
}

/**
 * Client wrapper around the whole /ref shell. Reads the active character +
 * profile from the URL and applies that profile's accent ramp as inline CSS
 * variables, re-theming every `glow-*` utility underneath. Colours come from
 * the server-built `accentMap` prop (see `getAccentMap`) so this client
 * component never imports the character data module. `usePathname()`
 * resolves during static generation, so the prerendered HTML already carries
 * the right colours (no flash), and `history.pushState` profile switches
 * update it live. Unknown characters and /ref fall back to the `:root`
 * default (cyan).
 */
export function RefThemeShell({
  accentMap,
  children,
}: Readonly<{ accentMap: AccentMap; children: React.ReactNode }>) {
  const pathname = usePathname();
  const parsed = parseRefPath(pathname);
  const characterAccents = parsed
    ? accentMap[parsed.characterSlug]
    : undefined;
  // Fall back to the character's first profile accent when the implied
  // profile doesn't exist (e.g. /ref/<char> for an NSFW-only character).
  const accent =
    parsed && characterAccents
      ? characterAccents[parsed.profileKey] ??
        Object.values(characterAccents)[0]
      : undefined;

  return (
    <main
      className="relative isolate flex min-h-screen flex-col bg-void"
      style={accent ? (accentVars(accent) as React.CSSProperties) : undefined}
    >
      {children}
    </main>
  );
}
