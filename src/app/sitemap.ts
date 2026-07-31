import type { MetadataRoute } from "next";
import {
  getCharacterParams,
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/gallery`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/ref`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/projects`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/friends`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/links`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [characters, profiles, examples, projects] = await Promise.all([
    getCharacterParams(),
    getProfileParams(),
    getExampleParams(),
    getProjects().catch(() => []),
  ]);

  const projectRoutes = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const characterRoutes = characters.map(({ character }) => ({
    url: `${siteUrl}/ref/${character}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const profileRoutes = profiles.map(({ character, profile }) => ({
    url: `${siteUrl}/ref/${character}/${profile}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const exampleRoutes = examples.map(({ character, profile, slug }) => ({
    url: `${siteUrl}/ref/${character}/${profile}/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...projectRoutes,
    ...characterRoutes,
    ...profileRoutes,
    ...exampleRoutes,
  ];
}
