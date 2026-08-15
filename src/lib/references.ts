import { unstable_cache } from "next/cache";

import type { TransformCollectionWithSelect } from "payload";

import type {
  Artist as StoredArtist,
  Artwork as StoredArtwork,
  ArtworksSelect,
  Character as StoredCharacter,
  CharacterImage as StoredCharacterImage,
  CharactersSelect,
  Friend as StoredFriend,
  FriendImage as StoredFriendImage,
  Media as StoredMedia,
  ProjectImage as StoredProjectImage,
  ProjectsSelect,
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
import { collectionTag, CONTENT_TAG } from "@/payload/hooks/revalidate";
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
 * What the loaders ask Payload for
 * ------------------------------------------------------------------ */

/**
 * The fields the mappers below actually read. Listing them keeps depth-2
 * population from dragging whole documents through the cache, and keeps the
 * authenticated-only field groups out of it a second way, independent of access
 * control.
 *
 * Adding a field to a mapper means adding it here — see `LoadedCharacter` and
 * friends for why forgetting to is a compile error rather than a blank page.
 */
const CHARACTER_FIELDS = {
  name: true,
  species: true,
  slug: true,
  // Sort key only.
  order: true,
  mainArt: true,
  sfw: true,
  nsfw: true,
} satisfies CharactersSelect;

const ARTWORK_FIELDS = {
  title: true,
  slug: true,
  character: true,
  profile: true,
  lifecycle: true,
  image: true,
  altImages: true,
  altArtworks: true,
  wipImages: true,
  overviewDisplay: true,
  overviewWipImage: true,
  wipPlaceholder: true,
  showWipHistory: true,
  artist: true,
  featuring: true,
  tags: true,
  // Sort keys only.
  order: true,
  createdAt: true,
  // Sitemap `lastModified`.
  updatedAt: true,
  // Deliberately absent: `commission` and `reminder`, which are
  // authenticated-only, and the `altOf` join — `buildAltNeighbours` rebuilds
  // both directions of the alt graph from `altArtworks`, and leaving the join
  // out of the selection saves a query per artwork.
} satisfies ArtworksSelect;

const PROJECT_FIELDS = {
  title: true,
  slug: true,
  summary: true,
  coverImage: true,
  body: true,
  links: true,
  status: true,
  year: true,
  featured: true,
  // Sort key only.
  order: true,
  // Sitemap `lastModified`.
  updatedAt: true,
} satisfies ProjectsSelect;

/**
 * Trims the *populated* documents, which `select` does not reach.
 *
 * Uploads are deliberately left whole. Payload rebuilds an upload's `url` from
 * its `filename` in an `afterRead` hook, so an upload trimmed to `url` alone
 * comes back with `url: null` — a blank image with nothing to catch it. `sizes`
 * has to stay intact for the same reason, and because `pickUploadRenderSource`
 * decides whether an upload is framed by looking for a `frame` key on it.
 */
const ARTWORK_POPULATE = {
  // Alt links are read for their id alone, to rebuild the symmetric alt graph.
  // Populating them in full costs a nested character, media document and join
  // query per link; `slug` is just the cheapest field that is not the id.
  artworks: { slug: true },
  // A cast member needs a name and something to link to. The profile tree
  // belongs to the characters query, not to every artwork that mentions one.
  characters: { name: true, slug: true },
} as const;

/**
 * The documents the loaders receive: `id` plus the selected fields, narrowed the
 * way Payload narrows them. Mapping against these rather than against the full
 * generated documents is what makes an unselected field a compile error instead
 * of a silently missing image.
 *
 * Populated relationships are *not* covered — `populate` is a runtime-only
 * option that Payload's types do not model — so `ARTWORK_POPULATE` has to be
 * kept honest by hand.
 */
type LoadedCharacter = TransformCollectionWithSelect<
  "characters",
  typeof CHARACTER_FIELDS
>;
type LoadedArtwork = TransformCollectionWithSelect<"artworks", typeof ARTWORK_FIELDS>;
type LoadedProject = TransformCollectionWithSelect<"projects", typeof PROJECT_FIELDS>;

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
 * The origin Payload prefixes onto every upload `url`, kept in step with the
 * `serverURL` in `src/payload.config.ts` by reading the same variable with the
 * same fallback.
 */
const SITE_ORIGIN = ((): string | undefined => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net").origin;
  } catch {
    return undefined;
  }
})();

/**
 * Setting `serverURL` turns every upload `url` from `/api/media/file/x.webp`
 * into `https://playwolf.net/api/media/file/x.webp`, and `next/image` treats any
 * absolute URL as remote — so without this every image on the site throws
 * "Invalid src prop" against an empty `images.remotePatterns`. Media is served
 * from this origin, so the prefix is noise; dropping it puts uploads back on
 * `next/image`'s local path, which is the invariant `next.config.ts` documents.
 *
 * A URL on any *other* origin is left alone: that is the case `remotePatterns`
 * exists for. `metadataBase` in the root layout still absolutises the relative
 * result for `og:image`, which is where absolute URLs are actually required.
 */
function toSameOriginPath(url: string): string {
  if (!SITE_ORIGIN || !url.startsWith(`${SITE_ORIGIN}/`)) return url;
  return url.slice(SITE_ORIGIN.length);
}

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
    url: toSameOriginPath(media.url),
    width: media.width,
    height: media.height,
  };

  // Every candidate `pickUploadRenderSource` can return is one of the URLs
  // handed to it verbatim, and each derivative carries the same prefix as the
  // main file, so stripping the winner covers `sizes` too.
  const picked = pickUploadRenderSource({
    original: { src: original.url, width: original.width, height: original.height },
    sizes: media.sizes,
  });

  return {
    src: toSameOriginPath(picked.src),
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
  // which is what the hand-written characters used to do explicitly.
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
function toFeatured(artwork: LoadedArtwork): Featured[] {
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

function toWipImages(entries: LoadedArtwork["wipImages"]): Example["wipImages"] {
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
function toExample(artwork: LoadedArtwork, alts: AltSlide[] = []): Example | undefined {
  const isWip = artwork.lifecycle === "in_progress";
  const src = toImageRef(artwork.image);
  if (!isWip && !src) return undefined;

  const wipImages = toWipImages(artwork.wipImages);
  const overviewImage = toImageRef(artwork.overviewWipImage) ?? wipImages[0]?.src;

  return {
    slug: artwork.slug,
    title: artwork.title,
    updatedAt: artwork.updatedAt,
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
function buildAltNeighbours(artworks: LoadedArtwork[]): Map<number, number[]> {
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
  stored: LoadedCharacter,
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
 *
 * Every loader below reads as an anonymous caller (`overrideAccess: false`), so
 * Payload's own access control decides what may enter a shared cache entry.
 * That is safe only because each collection these queries reach is
 * `read: anyone` — `characters`, `artworks`, `projects`, `artists`, `tags`,
 * `friends`, `media` and the four cropped upload libraries — and because none of
 * them relate to `users`, the one collection that is `read: authenticated`.
 * Restricting the read access of any of those would silently empty the public
 * site instead of raising an error. What anonymous access *does* strip is the
 * three authenticated-only field groups (`artworks.commission`,
 * `artworks.reminder`, `siteSettings.notifications`), which is the point: no
 * public mapper reads them and they must never be cached.
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
      overrideAccess: false,
      select: CHARACTER_FIELDS,
    }),
    payload.find({
      collection: "artworks",
      // Friends shown on example pages include their portrait, which is a
      // relationship nested inside the polymorphic `featuring` relationship.
      depth: 2,
      limit: 0,
      sort: ["order", "createdAt"],
      overrideAccess: false,
      select: ARTWORK_FIELDS,
      populate: ARTWORK_POPULATE,
    }),
  ]);

  const artworkById = new Map(artworks.docs.map((doc) => [doc.id, doc]));
  const characterSlugById = new Map(
    characters.docs.map((stored) => [stored.id, stored.slug]),
  );
  const altNeighbours = buildAltNeighbours(artworks.docs);

  function toAltSlides(artwork: LoadedArtwork): AltSlide[] {
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
 * Production reads are cached rather than the pages themselves, because the
 * production image is built without a database. Development reads stay
 * uncached: standalone scripts cannot call next/cache, and a persisted dev
 * cache otherwise survives database resets with content that no longer exists.
 * Payload hooks purge `CONTENT_TAG` for normal in-app writes.
 */
const cacheContent = process.env.NODE_ENV === "production";

const cachedCharacters = unstable_cache(loadCharacters, ["ref:characters"], {
  tags: [CONTENT_TAG],
});

/** All characters, in admin sort order. */
export function getCharacters(): Promise<Character[]> {
  return cacheContent ? cachedCharacters() : loadCharacters();
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

  // Querying through the relationship's own slug rather than resolving the
  // character first — one round trip, and the same triple that identifies the
  // artwork in its URL.
  const artworks = await payload.find({
    collection: "artworks",
    where: {
      and: [
        { slug: { equals: slug } },
        { profile: { equals: profile } },
        { "character.slug": { equals: characterSlug } },
      ],
    },
    limit: 1,
    depth: 0,
    select: { commission: true },
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
  const settings = await payload.findGlobal({
    slug: "siteSettings",
    depth: 1,
    overrideAccess: false,
  });

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
    return await (cacheContent ? cachedSiteSettings() : loadSiteSettings());
  } catch (error) {
    // The fallback lifts maintenance mode, which is the inverse of what the
    // operator asked for, so a serving instance must not do it quietly.
    // `next build` is the one place where there is legitimately no database.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.warn(
        "[references] site settings unreadable — serving defaults, so maintenance mode is OFF",
        error,
      );
    }
    return DEFAULT_SITE_SETTINGS;
  }
}

function toProject(stored: LoadedProject): Project {
  return {
    slug: stored.slug,
    title: stored.title,
    updatedAt: stored.updatedAt,
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
    overrideAccess: false,
    select: PROJECT_FIELDS,
  });

  return projects.docs.map(toProject);
}

/**
 * Narrower than `CONTENT_TAG`: a project is only ever assembled from its own
 * document and its cover upload, so saving an artwork has no business
 * rebuilding this. Both tags are needed — a re-crop rewrites the cover's URL and
 * dimensions without touching the project row. The rich-text editor allows
 * neither uploads nor internal document links, so `body` adds no third source.
 */
const cachedProjects = unstable_cache(loadProjects, ["site:projects"], {
  tags: [collectionTag("projects"), collectionTag("project-images")],
});

export function getProjects(): Promise<Project[]> {
  return cacheContent ? cachedProjects() : loadProjects();
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

export type ExampleParamsOptions = {
  /**
   * Drop in-progress pieces. For the sitemap: a WIP page is a placeholder, so
   * advertising it wastes crawl budget — but it keeps a working URL, a working
   * embed and no `noindex`, so anything already linked still resolves.
   *
   * Rating is *not* filtered, here or anywhere else. After Dark work stays
   * listed and indexable; reference URLs go straight to artists and have to
   * unfurl without the recipient opening the link.
   */
  publicOnly?: boolean;
};

/** Routes for `/ref/[character]/[profile]/[slug]`. */
export function getExampleParams({ publicOnly }: ExampleParamsOptions = {}) {
  return enumerate((characters) =>
    characters.flatMap((character) =>
      PROFILE_KEYS.flatMap((key) => {
        const profile = character.profiles[key];
        if (!profile) return [];
        return profile.examples
          .filter((example) => !(publicOnly && example.isWip))
          .map((example) => ({
            character: character.slug,
            profile: key,
            slug: example.slug,
          }));
      }),
    ),
  );
}
