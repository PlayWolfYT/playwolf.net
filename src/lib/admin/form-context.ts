import type { MediaOption } from "@/components/admin/MediaPicker";
import type { RelationshipOption } from "@/components/admin/RelationshipPicker";
import { documentToFormValues } from "@/lib/admin/document";
import { loadRelationOptionMap, listRecentMedia } from "@/lib/admin/options";
import { collectRelationSlugs, type AdminField } from "@/lib/admin/schema";

function polymorphicGroupsFrom(fields: AdminField[]): string[][] {
  const groups: string[][] = [];

  const walk = (list: AdminField[]) => {
    for (const field of list) {
      if (field.type === "relationship" && Array.isArray(field.relationTo)) {
        groups.push(field.relationTo);
      }
      if (field.fields) walk(field.fields);
      if (field.tabs) for (const tab of field.tabs) walk(tab.fields);
    }
  };

  walk(fields);
  return groups;
}

function collectMediaIds(value: unknown, into: Set<number>) {
  if (typeof value === "number" && Number.isFinite(value)) {
    into.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectMediaIds(entry, into);
    return;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      collectMediaIds(entry, into);
    }
  }
}

export type SchemaFormContext = {
  initialValues: Record<string, unknown>;
  relationOptions: Record<string, RelationshipOption[]>;
  mediaOptions: MediaOption[];
  mediaById: Record<number, MediaOption>;
};

/** Everything the client `SchemaForm` needs besides the field schema itself. */
export async function buildSchemaFormContext(
  fields: AdminField[],
  document: Record<string, unknown> | null | undefined,
): Promise<SchemaFormContext> {
  const initialValues = documentToFormValues(document, fields);
  const relationSlugs = collectRelationSlugs(fields);
  const [relationOptions, mediaOptions] = await Promise.all([
    loadRelationOptionMap(relationSlugs, polymorphicGroupsFrom(fields)),
    listRecentMedia(),
  ]);

  const mediaById: Record<number, MediaOption> = Object.fromEntries(
    mediaOptions.map((option) => [option.id, option]),
  );

  // Ensure currently selected media (even if older than "recent") is available.
  const selectedIds = new Set<number>();
  collectMediaIds(initialValues, selectedIds);
  const missing = [...selectedIds].filter((id) => !mediaById[id]);
  if (missing.length > 0) {
    const { getPayloadClient } = await import("@/lib/payload");
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "media",
      where: { id: { in: missing } },
      depth: 0,
      limit: missing.length,
      overrideAccess: true,
    });
    for (const doc of docs) {
      mediaById[doc.id] = {
        id: doc.id,
        url: doc.url ?? "",
        alt: doc.alt ?? doc.filename ?? "",
        thumbnailURL: doc.thumbnailURL ?? doc.sizes?.thumbnail?.url ?? undefined,
      };
    }
  }

  return { initialValues, relationOptions, mediaOptions, mediaById };
}
