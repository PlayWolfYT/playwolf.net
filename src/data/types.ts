import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";

/**
 * A single social link: either a plain URL (the handle is inferred from it),
 * or `{ url, description }` where `description` is shown in the tooltip (e.g.
 * "private", "Art Channel"). Descriptions may contain `\n` for multi-line
 * tooltips. For `email`, `url` is the bare address.
 */
export type SocialEntry = string | { url: string; description?: string };

/**
 * Artist social links. Every field is optional — only provided ones render.
 * `telegram` and `website` may list multiple entries.
 */
export type ArtistSocials = {
  twitter?: SocialEntry;
  bluesky?: SocialEntry;
  instagram?: SocialEntry;
  furaffinity?: SocialEntry;
  vgen?: SocialEntry;
  linktree?: SocialEntry;
  kofi?: SocialEntry;
  patreon?: SocialEntry;
  boosty?: SocialEntry;
  trello?: SocialEntry;
  telegram?: SocialEntry[];
  email?: SocialEntry;
  website?: SocialEntry | SocialEntry[];
};

export type Artist = {
  name: string;
  socials?: ArtistSocials;
};

type AlphabetLower =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
type Digits = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type ValidSlugChar = AlphabetLower | Digits | "-";

/**
 * Recursively checks if a string contains only lowercase letters, digits, or hyphens.
 */
export type ValidateSlug<
  S extends string,
  Original extends string = S,
> = S extends ""
  ? Original
  : S extends `${infer Char}${infer Rest}`
    ? Char extends ValidSlugChar
      ? ValidateSlug<Rest, Original>
      : never // Fails validation if an invalid character (like a space or uppercase) is found
    : never;

/** URL segment + lookup key for the two character profiles. */
export type ProfileKey = "sfw" | "nsfw";

/**
 * Identity helper that lets TypeScript validate each entry's slug literal
 * (via `ValidateSlug`) while keeping the array writable/inferable.
 */
export const defineExamples = <const T extends Example<any>[]>(
  arr: T & { [K in keyof T]: Example<T[K]["slug"]> },
) => arr;

export type Example<T extends string = string> = {
  /** URL-safe identifier used in `/ref/<character>/<profile>/[slug]` routes */
  slug: string extends T ? string : ValidateSlug<T>;
  /** Human-friendly title shown in the UI and embeds */
  title: string;
  /** Static import from `src/assets/art/` */
  src: StaticImageData;
  /** Optional crediting info shown in a bar below the full image */
  artist?: Artist;
};

export type RefSheet = {
  title: string;
  src: StaticImageData;
  description?: string;
  /** Optional crediting info shown in a bar below the sheet */
  artist?: Artist;
};

/**
 * One full character profile (SFW or After Dark): its own description,
 * reference sheet and example gallery. The rating is implied by which key the
 * profile lives under (`profiles.sfw` / `profiles.nsfw`).
 */
export type Profile = {
  /** Display label for the profile switcher, e.g. "SFW" / "After Dark" */
  label: string;
  /**
   * Accent colour as a hex string (e.g. `"#8EEDFF"`). Drives the /ref theme
   * (glow ramp, shadows, backdrop) while this profile is active.
   */
  accentColor: string;
  /**
   * Blurb shown at the top of this profile's panel. Accepts JSX, so
   * character files (`.tsx`) can use markup like `<b>…</b>`. Metadata
   * flattens it back to plain text via `reactNodeToText`.
   */
  description?: ReactNode;
  /** Reference sheet — omit if none exists yet (the panel just skips it) */
  sheet?: RefSheet;
  examples: Example[];
};

export type Character<T extends string = string> = {
  /** URL segment: /ref/<slug> */
  slug: string extends T ? string : ValidateSlug<T>;
  /** Display name, e.g. "PlayWuff" */
  name: string;
  /** Species / breed, e.g. Husky/Shepherd-Mix */
  species?: string;
  /** Hero image for the overview card and /ref/<slug> embed.
   *  Falls back to the first available reference sheet when omitted. */
  mainArt?: { src: StaticImageData; alt?: string; artist?: Artist };
  /** At least one profile should be present (NSFW-only characters are fine). */
  profiles: { sfw?: Profile; nsfw?: Profile };
};
