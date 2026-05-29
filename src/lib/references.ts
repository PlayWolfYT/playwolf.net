import { examples, refSheets } from "@/data/references";

export type {
  Artist,
  ArtistSocials,
  Example,
  RefSheet,
  RefSheetKey,
  SocialEntry,
} from "@/data/references";

export { refSheets };

/** All examples matching the requested NSFW flag, in declaration order. */
export function getExamples(nsfw: boolean) {
  return examples.filter((example) => example.nsfw === nsfw);
}

/** Single example by slug, scoped to the requested NSFW flag. */
export function getExample(slug: string, nsfw: boolean) {
  return examples.find(
    (example) => example.slug === slug && example.nsfw === nsfw,
  );
}

/** Slugs for `generateStaticParams`, scoped to the requested NSFW flag. */
export function getAllSlugs(nsfw: boolean) {
  return getExamples(nsfw).map((example) => example.slug);
}
