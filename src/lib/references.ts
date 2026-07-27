import { characters } from "@/data/characters";
import type {
  Artist,
  Character,
  Example,
  Profile,
  ProfileKey,
  RefSheet,
} from "@/data/types";

export type {
  Artist,
  ArtistSocials,
  Character,
  Example,
  Profile,
  ProfileKey,
  RefSheet,
  SocialEntry,
} from "@/data/types";

export const PROFILE_KEYS: ProfileKey[] = ["sfw", "nsfw"];

export function isProfileKey(value: string): value is ProfileKey {
  return value === "sfw" || value === "nsfw";
}

/** All characters in declaration order. */
export function getCharacters(): Character[] {
  return characters;
}

/** Single character by URL slug. */
export function getCharacter(slug: string): Character | undefined {
  return characters.find((character) => character.slug === slug);
}

/** First existing profile key for a character (SFW preferred). */
export function getDefaultProfileKey(character: Character): ProfileKey {
  return character.profiles.sfw ? "sfw" : "nsfw";
}

/** Full profile (description + sheet + examples) for a character, if present. */
export function getProfile(
  charSlug: string,
  key: ProfileKey,
): Profile | undefined {
  return getCharacter(charSlug)?.profiles[key];
}

/** Single example by slug, scoped to character + profile. */
export function getExample(
  charSlug: string,
  key: ProfileKey,
  slug: string,
): Example | undefined {
  return getProfile(charSlug, key)?.examples.find(
    (example) => example.slug === slug,
  );
}

/**
 * Hero image for overview cards and character embeds.
 * Falls back to the first available reference sheet when `mainArt` is
 * omitted; `undefined` when the character has no art at all yet.
 */
export function getMainArt(character: Character):
  | {
      src: RefSheet["src"];
      alt: string;
      artist?: Artist;
    }
  | undefined {
  if (character.mainArt) {
    return {
      src: character.mainArt.src,
      alt: character.mainArt.alt ?? character.name,
      artist: character.mainArt.artist,
    };
  }

  for (const key of PROFILE_KEYS) {
    const sheet = character.profiles[key]?.sheet;
    if (sheet) {
      return { src: sheet.src, alt: sheet.title, artist: sheet.artist };
    }
  }

  return undefined;
}

/**
 * Serializable character-slug → profile-key → accent-hex map.
 *
 * Built server-side and passed as a prop to `RefThemeShell` so the client
 * component can theme by pathname without importing the character data
 * module (which carries every static image import).
 */
export type AccentMap = Record<string, Partial<Record<ProfileKey, string>>>;

export function getAccentMap(): AccentMap {
  return Object.fromEntries(
    getCharacters().map((character) => [
      character.slug,
      Object.fromEntries(
        PROFILE_KEYS.flatMap((key) => {
          const profile = character.profiles[key];
          return profile ? [[key, profile.accentColor] as const] : [];
        }),
      ),
    ]),
  );
}

/** Params for `/ref/[character]`. */
export function getCharacterParams() {
  return getCharacters().map((character) => ({ character: character.slug }));
}

/** Params for `/ref/[character]/[profile]` (only profiles that exist). */
export function getProfileParams() {
  return getCharacters().flatMap((character) =>
    PROFILE_KEYS.filter((key) => character.profiles[key]).map((profile) => ({
      character: character.slug,
      profile,
    })),
  );
}

/** Params for `/ref/[character]/[profile]/[slug]`. */
export function getExampleParams() {
  return getCharacters().flatMap((character) =>
    PROFILE_KEYS.flatMap((key) => {
      const profile = character.profiles[key];
      if (!profile) return [];
      return profile.examples.map((example) => ({
        character: character.slug,
        profile: key,
        slug: example.slug,
      }));
    }),
  );
}
