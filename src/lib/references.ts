import { unstable_cache } from "next/cache";

import type {
  Artist as StoredArtist,
  Artwork as StoredArtwork,
  Character as StoredCharacter,
  CharacterImage as StoredCharacterImage,
  Friend as StoredFriend,
  FriendImage as StoredFriendImage,
  Media as StoredMedia,
  Project as StoredProject,
  ProjectImage as StoredProjectImage,
  SiteImage as StoredSiteImage,
  Tag as StoredTag,
} from "@/payload-types";
import type {
  AccentMap,
  AltSlide,
  Artist,
  Character,
  ContentLink,
  Example,
  ExampleCommission,
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
import { castWithSubject, DEFAULT_SITE_SETTINGS, sortExamples } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload";
import { CONTENT_TAG } from "@/payload/hooks/revalidate";
import {
  DEFAULT_WIP_ICON_COUNT,
  DEFAULT_WIP_ICONS,
  DEFAULT_WIP_INTERVAL,
  DEFAULT_WIP_QUOTES,
  NSFW_WIP_QUOTES,
  resolveWipSubtitle,
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
import { pickUploadRenderSource } from "@/lib/uploadSource";

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

/** Any upload collection we render through `ImageRef` (media + crop libraries). */
type StoredUpload =
  | StoredMedia
  | StoredFriendImage
  | StoredCharacterImage
  | StoredProjectImage
  | StoredSiteImage;

/**
 * Picks the render source for an upload. Framed libraries bake the admin crop
 * into the main file / matching derivatives — see `pickUploadRenderSource`.
 * Their focal point must not drive a second `object-cover` crop on the site.
 * Unframed `media` still uses focal → `objectPosition` for gallery cover slots.
 */
function toImageRef(
  value: number | StoredUpload | null | undefined,
): ImageRef | undefined {
  const media = resolved(value);
  if (!media?.url || !media.width || !media.height) return undefined;

  const original = {
    url: media.url,
    width: media.width,
    height: media.height,
  };

  const picked = pickUploadRenderSource({
    original: { src: original.url, width: original.width, height: original.height },
    sizes: media.sizes,
  });

  return {
    src: picked.src,
    width: picked.width,
    height: picked.height,
    blurDataURL: media.blurDataURL ?? undefined,
    objectPosition: picked.isFramed
      ? "50% 50%"
      : `${media.focalX ?? 50}% ${media.focalY ?? 50}%`,
    // Same filename is reused on re-crop (`overwriteExistingFiles`); bypass the
    // month-long `/_next/image` cache so the banner matches the file URL.
    unoptimized: picked.isFramed || undefined,
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
    subtitle: resolveWipSubtitle(wip?.subtitle),
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
  const others: Featured[] = (artwork.featuring ?? []).flatMap((entry) => {
    const person = resolved(entry.value);
    if (!person) return [];

    if (entry.relationTo === "friends") return [toFriend(person as StoredFriend)];

    return [{ kind: "character", name: person.name, slug: person.slug }];
  });

  const subject = resolved(artwork.character);

  return castWithSubject(
    subject && { kind: "character", name: subject.name, slug: subject.slug },
    others,
  );
}

function toWipImages(entries: StoredArtwork["wipImages"]): Example["wipImages"] {
  return (entries ?? []).flatMap((entry) => {
    const src = toImageRef(entry.image);
    if (!src) return [];
    return [
      {
        src,
        caption: entry.caption ?? undefined,
        addedAt: entry.addedAt ?? undefined,
      },
    ];
  });
}

/**
 * Public mapping — never includes `commission` (authenticated-only fields).
 * In-progress pieces may omit a final image; overview / first WIP fill the gap
 * for `overviewImage`, while `src` stays undefined until the final lands.
 */
function toExample(artwork: StoredArtwork, alts: AltSlide[] = []): Example | undefined {
  const isWip = artwork.lifecycle === "in_progress";
  const src = toImageRef(artwork.image);
  if (!isWip && !src) return undefined;

  const wipImages = toWipImages(artwork.wipImages);
  const overviewImage = toImageRef(artwork.overviewWipImage) ?? wipImages[0]?.src;

  return {
    slug: artwork.slug,
    title: artwork.title,
    src,
    isWip,
    overviewDisplay: artwork.overviewDisplay === "wipImage" ? "wipImage" : "generated",
    overviewImage,
    wipImages,
    showWipHistory: Boolean(artwork.showWipHistory),
    wipPlaceholder: isWip
      ? toWipOptions(artwork.wipPlaceholder, artwork.profile)
      : undefined,
    artist: toArtist(artwork.artist),
    featuring: toFeatured(artwork),
    tags: (artwork.tags ?? []).flatMap((tag) => toTag(tag) ?? []),
    alts,
  };
}

function relationId(value: number | { id: number }): number {
  return typeof value === "object" ? value.id : value;
}

/**
 * Alt links as one symmetric, one-hop union. Editors only link one side
 * (`altOf` is the automatic reverse in the admin), so here every stored
 * `altArtworks` edge is registered in both directions — scanning the whole
 * corpus covers the reverse direction without reading the join field.
 */
function buildAltNeighbours(artworks: StoredArtwork[]): Map<number, number[]> {
  const neighbours = new Map<number, number[]>();

  const link = (a: number, b: number) => {
    if (a === b) return;
    const list = neighbours.get(a) ?? [];
    if (!list.includes(b)) list.push(b);
    neighbours.set(a, list);
  };

  for (const artwork of artworks) {
    for (const entry of artwork.altArtworks ?? []) {
      const other = relationId(entry);
      link(artwork.id, other);
      link(other, artwork.id);
    }
  }

  return neighbours;
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

  const artworkById = new Map(artworks.docs.map((doc) => [doc.id, doc]));
  const characterSlugById = new Map(
    characters.docs.map((stored) => [stored.id, stored.slug]),
  );
  const altNeighbours = buildAltNeighbours(artworks.docs);

  function toAltSlides(artwork: StoredArtwork): AltSlide[] {
    // Inline variants always lead; linked counterparts follow in link order,
    // same-rating ones before cross-rating ones.
    const alts: AltSlide[] = (artwork.altImages ?? []).flatMap((entry) => {
      const image = toImageRef(entry.image);
      return image ? [{ image, label: entry.label ?? undefined }] : [];
    });
    const crossAlts: AltSlide[] = [];

    for (const id of altNeighbours.get(artwork.id) ?? []) {
      const other = artworkById.get(id);
      if (!other) continue;
      const characterSlug = characterSlugById.get(relationId(other.character));
      if (!characterSlug) continue;
      // A slide needs an image; WIP counterparts without one stay invisible.
      const image = toImageRef(other.image);
      if (!image) continue;

      const slide: AltSlide = {
        image,
        label: other.title,
        sourceHref: `/ref/${characterSlug}/${other.profile}/${other.slug}`,
        sourceTitle: other.title,
        artist: toArtist(other.artist),
      };

      if (other.profile === artwork.profile) alts.push(slide);
      else crossAlts.push({ ...slide, profile: other.profile });
    }

    return [...alts, ...crossAlts];
  }

  const byCharacter = new Map<number, Record<ProfileKey, Example[]>>();
  for (const artwork of artworks.docs) {
    const characterId =
      typeof artwork.character === "object" ? artwork.character.id : artwork.character;
    const example = toExample(artwork, toAltSlides(artwork));
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
      // Artworks query is already ordered; keep that within complete / WIP groups.
      sfw: toProfile(stored.sfw, "sfw", sortExamples(buckets.sfw)),
      nsfw: toProfile(stored.nsfw, "nsfw", sortExamples(buckets.nsfw)),
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

function toCommission(
  value: StoredArtwork["commission"],
): ExampleCommission | undefined {
  if (!value) return undefined;
  return {
    paid: Boolean(value.paid),
    artistStarted: Boolean(value.artistStarted),
    lastArtistUpdateAt: value.lastArtistUpdateAt ?? undefined,
    lastArtistUpdateNote: value.lastArtistUpdateNote ?? undefined,
  };
}

/**
 * Commission bookkeeping for an artwork. Callers must gate on an authenticated
 * session — the Local API read uses `overrideAccess` so field-level auth does
 * not strip the group. Never feed this into the public cached character tree.
 */
export async function getArtworkAdminMeta(
  characterSlug: string,
  profile: ProfileKey,
  slug: string,
): Promise<ExampleCommission | undefined> {
  const payload = await getPayloadClient();

  const characters = await payload.find({
    collection: "characters",
    where: { slug: { equals: characterSlug } },
    limit: 1,
    depth: 0,
  });
  const character = characters.docs[0];
  if (!character) return undefined;

  const artworks = await payload.find({
    collection: "artworks",
    where: {
      and: [
        { slug: { equals: slug } },
        { profile: { equals: profile } },
        { character: { equals: character.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  return toCommission(artworks.docs[0]?.commission);
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
