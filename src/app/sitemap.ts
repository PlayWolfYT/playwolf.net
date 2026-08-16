import type { MetadataRoute } from "next";
import { PROFILE_KEYS, type Character } from "@/lib/content";
import {
  getCharacterParams,
  getCharacters,
  getExampleParams,
  getProfileParams,
  getProjects,
} from "@/lib/references";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

/**
 * Served per request. Prerendering it would mean querying the database during
 * `next build`, which the production image does not have — and a sitemap
 * frozen at build time would miss every artwork added afterwards anyway.
 */
export const dynamic = "force-dynamic";

/** Most recent of a set of ISO stamps, ignoring the ones that are absent. */
function newest(stamps: (string | undefined)[]): string | undefined {
  let latest: string | undefined;
  let latestTime = -Infinity;

  for (const stamp of stamps) {
    if (!stamp) continue;
    const time = Date.parse(stamp);
    if (Number.isNaN(time) || time <= latestTime) continue;
    latest = stamp;
    latestTime = time;
  }

  return latest;
}

/** Freshness key, made of the same segments that form the page's URL. */
function pathKey(...segments: string[]): string {
  return segments.join("/");
}

/**
 * `updatedAt` per artwork, plus the derived freshness of the pages that list
 * them. Characters carry no stamp of their own — the document barely changes
 * once written, while its artwork list is what visitors come back for — so a
 * character page reports the newest of its artworks, and nothing at all when it
 * has none.
 */
function collectFreshness(characters: Character[]) {
  const artworks = new Map<string, string>();
  const profiles = new Map<string, string | undefined>();
  const perCharacter = new Map<string, string | undefined>();

  for (const character of characters) {
    const stamps: (string | undefined)[] = [];

    for (const key of PROFILE_KEYS) {
      const profile = character.profiles[key];
      if (!profile) continue;

      for (const example of profile.examples) {
        artworks.set(pathKey(character.slug, key, example.slug), example.updatedAt);
      }

      const profileStamp = newest(profile.examples.map((example) => example.updatedAt));
      profiles.set(pathKey(character.slug, key), profileStamp);
      stamps.push(profileStamp);
    }

    perCharacter.set(character.slug, newest(stamps));
  }

  return { artworks, profiles, perCharacter };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [characters, characterParams, profileParams, exampleParams, projects] =
    await Promise.all([
      getCharacters().catch(() => []),
      getCharacterParams(),
      getProfileParams(),
      // In-progress pieces are placeholders, so advertising them wastes crawl
      // budget. They keep working URLs, working embeds and no `noindex`. Rating
      // is deliberately not filtered — After Dark work stays listed.
      getExampleParams({ publicOnly: true }),
      getProjects().catch(() => []),
    ]);

  const freshness = collectFreshness(characters);
  const hasSfwProfile = new Set(
    characters.filter((character) => character.profiles.sfw).map(({ slug }) => slug),
  );
  const newestProject = newest(projects.map((project) => project.updatedAt));
  const newestArtwork = newest([...freshness.artworks.values()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
      lastModified: newest([newestProject, newestArtwork]),
    },
    {
      url: `${siteUrl}/gallery`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: newestArtwork,
    },
    {
      url: `${siteUrl}/ref`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: newestArtwork,
    },
    {
      url: `${siteUrl}/projects`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: newestProject,
    },
    // `/about` and `/links` both render `siteSettings`, which is not surfaced
    // with an edit stamp, so they go out without one.
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/links`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const projectRoutes = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: project.updatedAt,
  }));

  const characterRoutes = characterParams
    // An NSFW-only character's `/ref/{slug}` redirects to its After Dark page,
    // which is listed below. Submitting the redirect as well only earns a "Page
    // with redirect" in Search Console.
    .filter(({ character }) => hasSfwProfile.has(character))
    .map(({ character }) => ({
      url: `${siteUrl}/ref/${character}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: freshness.perCharacter.get(character),
    }));

  const profileRoutes = profileParams
    // `/ref/{slug}/sfw` canonicalises to `/ref/{slug}`, so listing both reports
    // the alias as "Submitted URL not selected as canonical".
    .filter(({ profile }) => profile !== "sfw")
    .map(({ character, profile }) => ({
      url: `${siteUrl}/ref/${character}/${profile}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      lastModified: freshness.profiles.get(pathKey(character, profile)),
    }));

  const exampleRoutes = exampleParams.map(({ character, profile, slug }) => ({
    url: `${siteUrl}/ref/${character}/${profile}/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    lastModified: freshness.artworks.get(pathKey(character, profile, slug)),
  }));

  return [
    ...staticRoutes,
    ...projectRoutes,
    ...characterRoutes,
    ...profileRoutes,
    ...exampleRoutes,
  ];
}
