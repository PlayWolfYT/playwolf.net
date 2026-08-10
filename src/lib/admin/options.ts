import type { RelationshipOption } from "@/components/admin/RelationshipPicker";
import type { MediaOption } from "@/components/admin/MediaPicker";
import { getPayloadClient } from "@/lib/payload";

const TITLE_FIELDS = ["name", "title", "label", "filename", "email"] as const;

function titleFrom(doc: Record<string, unknown>): string {
  for (const key of TITLE_FIELDS) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return `#${doc.id}`;
}

/** Preload relationship options for any collection slug. */
export async function listRelationshipOptions(
  collection: string,
): Promise<RelationshipOption[]> {
  const payload = await getPayloadClient();
  if (!(collection in payload.collections)) return [];

  const { docs } = await payload.find({
    collection: collection as "artists",
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  return docs.map((doc) => ({
    value: String(doc.id),
    label: titleFrom(doc as unknown as Record<string, unknown>),
  }));
}

/** Options for a polymorphic relationship spanning several collections. */
export async function listPolymorphicOptions(
  collections: string[],
): Promise<RelationshipOption[]> {
  const lists = await Promise.all(
    collections.map(async (collection) => {
      const options = await listRelationshipOptions(collection);
      return options.map((option) => ({
        ...option,
        value: `${collection}:${option.value}`,
        hint: collection,
      }));
    }),
  );
  return lists.flat();
}

export async function listRecentMedia(limit = 48): Promise<MediaOption[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "media",
    depth: 0,
    limit,
    sort: "-createdAt",
    overrideAccess: true,
  });

  return docs.map((doc) => ({
    id: doc.id,
    url: doc.url ?? "",
    alt: doc.alt ?? doc.filename ?? "",
    thumbnailURL: doc.thumbnailURL ?? doc.sizes?.thumbnail?.url ?? undefined,
  }));
}

/**
 * Build a map of `collectionSlug → options` for every relationship the
 * schema references. Polymorphic fields use a joined key `a|b|c`.
 */
export async function loadRelationOptionMap(
  relationSlugs: string[],
  polymorphicGroups: string[][] = [],
): Promise<Record<string, RelationshipOption[]>> {
  const unique = [...new Set(relationSlugs)];
  const entries = await Promise.all(
    unique.map(async (slug) => [slug, await listRelationshipOptions(slug)] as const),
  );
  const map: Record<string, RelationshipOption[]> = Object.fromEntries(entries);

  for (const group of polymorphicGroups) {
    const key = group.slice().sort().join("|");
    if (!map[key]) {
      map[key] = await listPolymorphicOptions(group);
    }
  }

  return map;
}
