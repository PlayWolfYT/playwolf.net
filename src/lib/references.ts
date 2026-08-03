import { unstable_cache } from "next/cache";

import type {
  Artist as StoredArtist,
  Artwork as StoredArtwork,
  Character as StoredCharacter,
  Friend as StoredFriend,
  Media as StoredMedia,
  Project as StoredProject,
  Tag as StoredTag,
} from "@/payload-types";
import type {
  AccentMap,
  Artist,
  Character,
  ContentLink,
  Example,
  Featured,
  GalleryItem,
  ImageRef,
  Profile,
  ProfileKey,
  Project,
  RefSheet,
  RefSheetWipOptions,
  SiteSettings,
  Tag,
  WipAspect,
} from "@/lib/content";
import { castWithSubject, DEFAULT_SITE_SETTINGS } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload";
import { CONTENT_TAG } from "@/payload/hooks/revalidate";
import {
  DEFAULT_WIP_ICON_COUNT,
  DEFAULT_WIP_ICONS,
  DEFAULT_WIP_INTERVAL,
  DEFAULT_WIP_QUOTES,
  NSFW_WIP_QUOTES,
} from "@/lib/sheet-wip";

/**
 * Reading content means reaching Payload, which means `sharp` and the Postgres
 * driver — none of which can be bundled for the browser. Client components
 * import the vocabulary from `@/lib/content` directly instead; this module is
 * server-only, and re-exports the vocabulary purely as a convenience for the
 * server components that need both.
 */
export * from "@/lib/content";
export {
  DEFAULT_WIP_ICONS,
  DEFAULT_WIP_INTERVAL,
  DEFAULT_WIP_QUOTES,
  NSFW_WIP_QUOTES,
} from "@/lib/sheet-wip";

import { PROFILE_KEYS } from "@/lib/content";

/* ------------------------------------------------------------------ *
 * Mapping: stored shape → the shape components consume
 * ------------------------------------------------------------------ */

/** Relationships come back as an id when unresolved; only the object is useful. */
function resolved<T extends object>(
  value: number | T | null | undefined,
): T | undefined {
  return value && typeof value === "object" ? value : undefined;
}

function toLinks(links: StoredArtist["links"]): ContentLink[] {
  return (links ?? []).map((link) => ({
    kind: link.kind,
    url: link.url,
    description: link.description ?? undefined,
  }));
}

function toArtist(value: number | StoredArtist | null | undefined): Artist | undefined {
  const artist = resolved(value);
  if (!artist) return undefined;
  return {
    name: artist.name,
    slug: artist.slug,
    links: toLinks(artist.links),
  };
}

function toTag(value: number | StoredTag): Tag | undefined {
  const tag = resolved(value);
  return tag ? { label: tag.label, slug: tag.slug } : undefined;
}

/**
 * Picks the largest bounded derivative as the render source, falling back to
 * the upload itself — `withoutEnlargement` means an image smaller than every
 * configured size produces no derivatives at all.
 */
function toImageRef(
  value: number | StoredMedia | null | undefined,
): ImageRef | undefined {
  const media = resolved(value);
  if (!media?.url || !media.width || !media.height) return undefined;

  const original = {
    url: media.url,
    width: media.width,
    height: media.height,
  };

  const derivative = media.sizes?.display ?? media.sizes?.card;
  const usable =
    derivative?.url && derivative.width && derivative.height
      ? { src: derivative.url, width: derivative.width, height: derivative.height }
      : { src: original.url, width: original.width, height: original.height };

  return {
    ...usable,
    blurDataURL: media.blurDataURL ?? undefined,
    objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 50}%`,
    original,
  };
}

type StoredProfile = NonNullable<StoredCharacter["sfw"]>;
type StoredSheet = NonNullable<StoredProfile["sheet"]>;

function toWipOptions(
  wip: NonNullable<StoredSheet["wip"]> | undefined,
  key: ProfileKey,
): RefSheetWipOptions {
  const quotes = (wip?.quotes ?? []).map((entry) => entry.text).filter(Boolean);
  const icons = (wip?.icons ?? []).map((entry) => entry.name).filter(Boolean);
  const gradient = (wip?.gradient ?? []).map((entry) => entry.color).filter(Boolean);

  // An After Dark sheet that names no quotes of its own gets the racier pool,
  // which is what the hand-written character files used to do explicitly.
  const fallbackQuotes = key === "nsfw" ? NSFW_WIP_QUOTES : DEFAULT_WIP_QUOTES;

  return {
    badge: wip?.badge || "WIP",
    subtitle: wip?.subtitle || "Reference sheet in progress",
    quotes: quotes.length > 0 ? quotes : [...fallbackQuotes],
    icons: icons.length > 0 ? icons : [...DEFAULT_WIP_ICONS],
    iconCount: wip?.iconCount ?? DEFAULT_WIP_ICON_COUNT,
    gradient,
    interval: wip?.interval ?? DEFAULT_WIP_INTERVAL,
    progress: wip?.progress ?? undefined,
    aspect: (wip?.aspect ?? "4/3") as WipAspect,
  };
}

function toSheet(
  sheet: StoredSheet | undefined,
  key: ProfileKey,
): RefSheet | undefined {
  if (!sheet || !sheet.kind || sheet.kind === "none") return undefined;

  const shared = {
    title: sheet.title ?? "",
    description: sheet.description ?? undefined,
    artist: toArtist(sheet.artist),
  };

  if (sheet.kind === "wip") {
    return { ...shared, kind: "wip", wip: toWipOptions(sheet.wip, key) };
  }

  const src = toImageRef(sheet.image);
  // An image sheet without a usable image is indistinguishable from no sheet.
  return src ? { ...shared, kind: "image", src } : undefined;
}

function toFriend(friend: StoredFriend): Featured {
  return {
    kind: "friend",
    name: friend.name,
    slug: friend.slug,
    image: toImageRef(friend.image),
    description: friend.description ?? undefined,
    links: toLinks(friend.links),
  };
}

/**
 * The stored cast is everyone *besides* the subject; the artwork's own
 * character is always in the picture, so it is prepended rather than typed in
 * a second time.
 */
function toFeatured(artwork: StoredArtwork): Featured[] {
  const others = (artwork.featuring ?? []).flatMap((entry) => {
    const person = resolved(entry.value);
    if (!person) return [];

    if (entry.relationTo === "friends") return [toFriend(person as StoredFriend)];

    return [{ kind: "character", name: person.name, slug: person.slug } as Featured];
  });

  const subject = resolved(artwork.character);

  return castWithSubject(
    subject && { kind: "character", name: subject.name, slug: subject.slug },
    others,
  );
}

function toExample(artwork: StoredArtwork): Example | undefined {
  const src = toImageRef(artwork.image);
  if (!src) return undefined;

  return {
    slug: artwork.slug,
    title: artwork.title,
    src,
    artist: toArtist(artwork.artist),
    featuring: toFeatured(artwork),
    tags: (artwork.tags ?? []).flatMap((tag) => toTag(tag) ?? []),
  };
}

function toProfile(
  stored: StoredProfile | undefined,
  key: ProfileKey,
  examples: Example[],
): Profile | undefined {
  if (!stored?.enabled) return undefined;

  return {
    key,
    label: stored.label || (key === "nsfw" ? "After Dark" : "SFW"),
    accentColor: stored.accentColor || "#3abef9",
    description: stored.description ?? undefined,
    sheet: toSheet(stored.sheet, key),
    examples,
  };
}

/** Falls back to the first image reference sheet, mirroring the admin's hint. */
function toMainArt(
  stored: StoredCharacter,
  profiles: Character["profiles"],
): Character["mainArt"] {
  const explicit = toImageRef(stored.mainArt?.image);
  if (explicit) {
    return {
      src: explicit,
      alt: stored.mainArt?.alt || stored.name,
      artist: toArtist(stored.mainArt?.artist),
    };
  }

  for (const key of PROFILE_KEYS) {
    const sheet = profiles[key]?.sheet;
    if (sheet?.kind === "image") {
      return { src: sheet.src, alt: sheet.title || stored.name, artist: sheet.artist };
    }
  }

  return undefined;
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

async function loadCharacters(): Promise<Character[]> {
  const payload = await getPayloadClient();

  // Two unbounded queries and an in-memory join. The whole corpus is a handful
  // of characters and tens of artworks, so this is cheaper than a query per
  // profile — and it is what the cache below stores.
  const [characters, artworks] = await Promise.all([
    payload.find({
      collection: "characters",
      depth: 1,
      limit: 0,
      sort: ["order", "name"],
    }),
    payload.find({
      collection: "artworks",
      // Friends shown on example pages include their portrait, which is a
      // relationship nested inside the polymorphic `featuring` relationship.
      depth: 2,
      limit: 0,
      sort: ["order", "createdAt"],
    }),
  ]);

  const byCharacter = new Map<number, Record<ProfileKey, Example[]>>();
  for (const artwork of artworks.docs) {
    const characterId =
      typeof artwork.character === "object" ? artwork.character.id : artwork.character;
    const example = toExample(artwork);
    if (!example) continue;

    const buckets =
      byCharacter.get(characterId) ??
      ({ sfw: [], nsfw: [] } satisfies Record<ProfileKey, Example[]>);
    buckets[artwork.profile].push(example);
    byCharacter.set(characterId, buckets);
  }

  return characters.docs.map((stored) => {
    const buckets = byCharacter.get(stored.id) ?? { sfw: [], nsfw: [] };
    const profiles: Character["profiles"] = {
      sfw: toProfile(stored.sfw, "sfw", buckets.sfw),
      nsfw: toProfile(stored.nsfw, "nsfw", buckets.nsfw),
    };

    return {
      slug: stored.slug,
      name: stored.name,
      species: stored.species ?? undefined,
      mainArt: toMainArt(stored, profiles),
      profiles,
    };
  });
}

/**
 * Reads are cached rather than the pages themselves, because the production
 * image is built without a database. The Payload hooks in
 * `src/payload/hooks/revalidate.ts` purge `CONTENT_TAG` on every write, so an
 * edit in the admin is live on the next request.
 */
const cachedCharacters = unstable_cache(loadCharacters, ["ref:characters"], {
  tags: [CONTENT_TAG],
});

/** All characters, in admin sort order. */
export function getCharacters(): Promise<Character[]> {
  return cachedCharacters();
}

/** Single character by URL slug. */
export async function getCharacter(slug: string): Promise<Character | undefined> {
  const characters = await getCharacters();
  return characters.find((character) => character.slug === slug);
}

/** First existing profile key for a character (SFW preferred). */
export function getDefaultProfileKey(character: Character): ProfileKey {
  return character.profiles.sfw ? "sfw" : "nsfw";
}

/** Full profile (description + sheet + examples) for a character, if present. */
export async function getProfile(
  charSlug: string,
  key: ProfileKey,
): Promise<Profile | undefined> {
  const character = await getCharacter(charSlug);
  return character?.profiles[key];
}

/** Single example by slug, scoped to character + profile. */
export async function getExample(
  charSlug: string,
  key: ProfileKey,
  slug: string,
): Promise<Example | undefined> {
  const profile = await getProfile(charSlug, key);
  return profile?.examples.find((example) => example.slug === slug);
}

export async function getAccentMap(): Promise<AccentMap> {
  const characters = await getCharacters();

  return Object.fromEntries(
    characters.map((character) => [
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

/* ------------------------------------------------------------------ *
 * Gallery
 * ------------------------------------------------------------------ */

/**
 * Every artwork on the site as one flat list, with the character and profile it
 * belongs to attached so a piece can be linked back to its own page. Derived
 * from the character tree rather than queried separately — that tree is already
 * cached, and rebuilding it here would only give the two views different ideas
 * about what exists.
 */
export async function getGallery(): Promise<GalleryItem[]> {
  const characters = await getCharacters();

  return characters.flatMap((character) =>
    PROFILE_KEYS.flatMap((key) => {
      const profile = character.profiles[key];
      if (!profile) return [];
      return profile.examples.map((example) => ({
        example,
        character,
        profile: key,
      }));
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Site settings and projects
 * ------------------------------------------------------------------ */

async function loadSiteSettings(): Promise<SiteSettings> {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({ slug: "siteSettings", depth: 1 });

  return {
    maintenanceMode: Boolean(settings.maintenanceMode),
    maintenanceMessage: settings.maintenanceMessage ?? undefined,
    // `null`/missing means "never configured" → keep `/ref` reachable.
    // An explicit empty array means the admin cleared every exception.
    maintenanceExcludedPaths: Array.isArray(settings.maintenanceExcludedPaths)
      ? settings.maintenanceExcludedPaths.filter(
          (path): path is string => typeof path === "string" && path.trim().length > 0,
        )
      : DEFAULT_SITE_SETTINGS.maintenanceExcludedPaths,
    heroTitle: settings.heroTitle ?? undefined,
    heroTagline: settings.heroTagline ?? undefined,
    about: settings.about ?? undefined,
    ogImage: toImageRef(settings.ogImage),
    links: toLinks(settings.links),
  };
}

const cachedSiteSettings = unstable_cache(loadSiteSettings, ["site:settings"], {
  tags: [CONTENT_TAG],
});

/**
 * Never throws. Every page in the site reads this to decide whether to serve
 * the maintenance screen, so a failure here would take the whole frontend down
 * — and it is also read during `next build`, which has no database.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await cachedSiteSettings();
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

function toProject(stored: StoredProject): Project {
  return {
    slug: stored.slug,
    title: stored.title,
    summary: stored.summary ?? undefined,
    cover: toImageRef(stored.coverImage),
    body: stored.body ?? undefined,
    links: toLinks(stored.links),
    status: stored.status ?? "live",
    year: stored.year ?? undefined,
    featured: Boolean(stored.featured),
  };
}

async function loadProjects(): Promise<Project[]> {
  const payload = await getPayloadClient();
  const projects = await payload.find({
    collection: "projects",
    depth: 1,
    limit: 0,
    sort: ["order", "-year", "title"],
  });

  return projects.docs.map(toProject);
}

const cachedProjects = unstable_cache(loadProjects, ["site:projects"], {
  tags: [CONTENT_TAG],
});

export function getProjects(): Promise<Project[]> {
  return cachedProjects();
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
}

/* ------------------------------------------------------------------ *
 * Route enumeration
 * ------------------------------------------------------------------ */

/**
 * `next build` runs inside a Docker image that has no database, and the
 * sitemap is the one route that would otherwise fail the build outright.
 * Listing nothing is the honest answer when the content is unreachable.
 */
async function enumerate<T>(build: (characters: Character[]) => T[]): Promise<T[]> {
  try {
    return build(await getCharacters());
  } catch {
    return [];
  }
}

/** Routes for `/ref/[character]`. */
export function getCharacterParams() {
  return enumerate((characters) =>
    characters.map((character) => ({ character: character.slug })),
  );
}

/** Routes for `/ref/[character]/[profile]` (only profiles that exist). */
export function getProfileParams() {
  return enumerate((characters) =>
    characters.flatMap((character) =>
      PROFILE_KEYS.filter((key) => character.profiles[key]).map((profile) => ({
        character: character.slug,
        profile,
      })),
    ),
  );
}

/** Routes for `/ref/[character]/[profile]/[slug]`. */
export function getExampleParams() {
  return enumerate((characters) =>
    characters.flatMap((character) =>
      PROFILE_KEYS.flatMap((key) => {
        const profile = character.profiles[key];
        if (!profile) return [];
        return profile.examples.map((example) => ({
          character: character.slug,
          profile: key,
          slug: example.slug,
        }));
      }),
    ),
  );
}
