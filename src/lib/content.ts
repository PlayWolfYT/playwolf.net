/**
 * The vocabulary the frontend speaks. Payload's generated types describe how
 * content is *stored* — every field nullable, relationships possibly unresolved
 * ids — which is a poor thing to hand to a component. `references.ts` maps one
 * onto the other so pages deal in values that are present or absent, never
 * "maybe a number".
 */

import type { Character as StoredCharacter } from "@/payload-types";
import type { LinkKind } from "@/payload/fields/links";

export type { LinkKind };

/** A Lexical document, exactly as Payload persists it. */
export type RichTextValue = NonNullable<
  NonNullable<StoredCharacter["sfw"]>["description"]
>;

/**
 * An image ready to render. The field names match `StaticImageData`, so
 * components still pass this straight to `<Image src={...} />` — but `src`
 * points at a bounded derivative rather than the upload, so the optimizer never
 * has to decode a 15 MB original on a cache miss.
 *
 * `original` is that upload, and is only ever used as a plain link target.
 */
export type ImageRef = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
  /** CSS position derived from Payload's adjustable media focal point. */
  objectPosition: string;
  original: {
    url: string;
    width: number;
    height: number;
  };
};

/**
 * `next/image` throws if told to blur without data, and the upload hook that
 * generates placeholders skips GIFs and gives up rather than failing an upload.
 */
export function placeholderFor(image: ImageRef): "blur" | "empty" {
  return image.blurDataURL ? "blur" : "empty";
}

/** One social or contact link. `description` fills the tooltip when present. */
export type ContentLink = {
  kind: LinkKind;
  url: string;
  description?: string;
};

export type Artist = {
  name: string;
  slug: string;
  links: ContentLink[];
};

export type Friend = {
  name: string;
  slug: string;
  image?: ImageRef;
  description?: RichTextValue;
  links: ContentLink[];
};

export type Tag = {
  label: string;
  slug: string;
};

export type ProjectStatus = "live" | "wip" | "planned" | "archived";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  wip: "In progress",
  planned: "Coming soon",
  archived: "Archived",
};

export type Project = {
  slug: string;
  title: string;
  summary?: string;
  cover?: ImageRef;
  body?: RichTextValue;
  links: ContentLink[];
  status: ProjectStatus;
  year?: number;
  featured: boolean;
};

/** Site-wide switches and copy, edited as a Payload global. */
export type SiteSettings = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  /**
   * Path prefixes left reachable during maintenance. Missing/null falls back
   * to `/ref`; an explicit empty list excludes nothing.
   */
  maintenanceExcludedPaths: string[];
  heroTitle?: string;
  heroTagline?: string;
  about?: RichTextValue;
  ogImage?: ImageRef;
  links: ContentLink[];
};

/**
 * What the site falls back to when settings cannot be read — during
 * `next build`, which runs without a database. Erring towards *not* in
 * maintenance matters: a database blip should never black out the site.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  maintenanceMode: false,
  // Keep in sync with `SiteSettings.maintenanceExcludedPaths` defaultValue.
  maintenanceExcludedPaths: ["/ref"],
  links: [],
};

/** One of this site's own characters present in a picture. */
export type FeaturedCharacter = {
  kind: "character";
  name: string;
  slug: string;
};

/** A friend's character, including the details shown alongside the artwork. */
export type FeaturedFriend = Friend & {
  kind: "friend";
};

/** Someone present in a picture. */
export type Featured = FeaturedCharacter | FeaturedFriend;

/**
 * The full cast of a picture: the character it belongs to first, then everyone
 * else. The subject is never stored alongside the others — it is the artwork's
 * own `character` — so it is merged in here, and duplicates are dropped for
 * data written before that convention existed.
 */
export function castWithSubject(
  subject: FeaturedCharacter | undefined,
  others: Featured[],
): Featured[] {
  const cast = subject ? [subject, ...others] : others;
  const seen = new Set<string>();

  return cast.filter((person) => {
    const key = `${person.kind}:${person.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** URL segment and lookup key for the two character profiles. */
export type ProfileKey = "sfw" | "nsfw";

export const PROFILE_KEYS: ProfileKey[] = ["sfw", "nsfw"];

export function isProfileKey(value: string): value is ProfileKey {
  return value === "sfw" || value === "nsfw";
}

/**
 * Character-slug → profile-key → accent hex. Built on the server and handed to
 * the client theme shell as a prop, so theming by pathname costs the browser
 * nothing but this map.
 */
export type AccentMap = Record<string, Partial<Record<ProfileKey, string>>>;

/** Frame proportions for the WIP placeholder. */
export type WipAspect = "4/3" | "3/2" | "16/9" | "1/1";

/**
 * Kebab-case lucide icon name, e.g. `paintbrush`. Stored as a string rather
 * than a component so the admin can pick one and the value survives the
 * database round trip.
 */
export type WipIconName = string;

/** Display options for a reference sheet that doesn't exist yet. */
export type RefSheetWipOptions = {
  badge: string;
  subtitle: string;
  quotes: string[];
  icons: WipIconName[];
  iconCount: number;
  /** Hex colours blended left-to-right. Empty follows the profile accent. */
  gradient: string[];
  interval: number;
  progress?: number;
  aspect: WipAspect;
};

type RefSheetBase = {
  title: string;
  description?: string;
  artist?: Artist;
};

export type RefSheetImage = RefSheetBase & {
  kind: "image";
  src: ImageRef;
};

export type RefSheetWip = RefSheetBase & {
  kind: "wip";
  wip: RefSheetWipOptions;
};

export type RefSheet = RefSheetImage | RefSheetWip;

export function isImageSheet(sheet: RefSheet): sheet is RefSheetImage {
  return sheet.kind === "image";
}

export function isWipSheet(sheet: RefSheet): sheet is RefSheetWip {
  return sheet.kind === "wip";
}

/** The sheet's artwork, or nothing when it is still a placeholder. */
export function getSheetImage(
  sheet: RefSheet | undefined,
): { src: ImageRef; alt: string } | undefined {
  if (!sheet || !isImageSheet(sheet)) return undefined;
  return { src: sheet.src, alt: sheet.title };
}

/** A single piece of art within a character's profile gallery. */
export type Example = {
  slug: string;
  title: string;
  src: ImageRef;
  artist?: Artist;
  featuring: Featured[];
  tags: Tag[];
};

/**
 * One full character profile (SFW or After Dark). The rating is implied by
 * `key`, which is also the URL segment.
 */
export type Profile = {
  key: ProfileKey;
  /** Display label for the profile switcher, e.g. "SFW" / "After Dark". */
  label: string;
  /** Hex accent driving the /ref theme while this profile is active. */
  accentColor: string;
  description?: RichTextValue;
  sheet?: RefSheet;
  examples: Example[];
};

export type Character = {
  slug: string;
  name: string;
  species?: string;
  mainArt?: {
    src: ImageRef;
    alt: string;
    artist?: Artist;
  };
  /** At least one is present; NSFW-only characters are fine. */
  profiles: {
    sfw?: Profile;
    nsfw?: Profile;
  };
};

/**
 * Hero image for overview cards and embeds. The fallback to a profile's
 * reference sheet is applied while mapping, so by this point it is a lookup.
 */
export function getMainArt(character: Character): Character["mainArt"] {
  return character.mainArt;
}

/* ------------------------------------------------------------------ *
 * Gallery browsing
 * ------------------------------------------------------------------ */

/** One artwork, plus where it lives — enough to link back to its own page. */
export type GalleryItem = {
  example: Example;
  character: Character;
  profile: ProfileKey;
};

/** The dimensions the gallery can be narrowed by. */
export const FACET_KEYS = ["character", "artist", "friend", "tag"] as const;
export type FacetKey = (typeof FACET_KEYS)[number];

export const FACET_LABELS: Record<FacetKey, string> = {
  character: "Character",
  artist: "Artist",
  friend: "Friend",
  tag: "Tag",
};

/** A value one facet can take, with how many artworks carry it. */
export type FacetOption = {
  slug: string;
  label: string;
  count: number;
};

/** Active narrowing. An absent key means "any". */
export type GalleryFilter = Partial<Record<FacetKey, string>> & {
  /** SFW work only unless explicitly widened. */
  includeNsfw?: boolean;
};

/** Every slug an item can be found under, per facet. */
function facetValues(
  item: GalleryItem,
  key: FacetKey,
): { slug: string; label: string }[] {
  switch (key) {
    case "character":
      return [{ slug: item.character.slug, label: item.character.name }];
    case "artist":
      return item.example.artist
        ? [{ slug: item.example.artist.slug, label: item.example.artist.name }]
        : [];
    case "friend":
      return item.example.featuring
        .filter((person) => person.kind === "friend")
        .map((person) => ({ slug: person.slug, label: person.name }));
    case "tag":
      return item.example.tags.map((tag) => ({ slug: tag.slug, label: tag.label }));
  }
}

export function matchesFilter(item: GalleryItem, filter: GalleryFilter): boolean {
  if (item.profile === "nsfw" && !filter.includeNsfw) return false;

  return FACET_KEYS.every((key) => {
    const wanted = filter[key];
    if (!wanted) return true;
    return facetValues(item, key).some((value) => value.slug === wanted);
  });
}

/**
 * Counts for one facet, measured against everything the *other* filters allow.
 * Counting against the fully filtered set instead would leave every unselected
 * option at zero the moment a filter is applied, which is not a useful list.
 */
export function facetOptions(
  items: GalleryItem[],
  key: FacetKey,
  filter: GalleryFilter,
): FacetOption[] {
  const others = { ...filter, [key]: undefined };
  const counts = new Map<string, FacetOption>();

  for (const item of items) {
    if (!matchesFilter(item, others)) continue;
    for (const { slug, label } of facetValues(item, key)) {
      const existing = counts.get(slug);
      if (existing) existing.count += 1;
      else counts.set(slug, { slug, label, count: 1 });
    }
  }

  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
}
