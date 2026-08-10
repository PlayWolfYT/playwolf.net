import type { Field, SanitizedCollectionConfig, SanitizedGlobalConfig } from "payload";

import {
  collectRelationSlugs,
  serializeFields,
  type AdminCollectionSchema,
  type AdminGlobalSchema,
} from "@/lib/admin/schema";
import { getPayloadClient } from "@/lib/payload";

function entityLabel(
  labels: unknown,
  fallback: string,
  plurality: "singular" | "plural",
): string {
  if (!labels || typeof labels !== "object") return fallback;
  const value = (labels as Record<string, unknown>)[plurality];
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "en" in value) {
    const en = (value as { en?: unknown }).en;
    if (typeof en === "string") return en;
  }
  return fallback;
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Auth collections get `email` / `password` injected by Payload into the
 * sanitized config. Password is create/update-only — expose it on the form
 * when missing from serialized fields.
 */
function ensureAuthFields(fields: Field[], auth: boolean): Field[] {
  if (!auth) return fields;
  const names = new Set(
    fields.flatMap((field) => ("name" in field && field.name ? [field.name] : [])),
  );
  const extras: Field[] = [];
  if (!names.has("email")) {
    extras.push({
      name: "email",
      type: "email",
      required: true,
    });
  }
  if (!names.has("password")) {
    extras.push({
      name: "password",
      type: "text",
      required: true,
      admin: {
        description:
          "Set on create; leave blank when editing to keep the current password.",
      },
    });
  }
  return extras.length > 0 ? [...extras, ...fields] : fields;
}

function toCollectionSchema(config: SanitizedCollectionConfig): AdminCollectionSchema {
  const auth = Boolean(config.auth);
  const fields = serializeFields(ensureAuthFields(config.fields, auth)).map((field) =>
    field.name === "password"
      ? { ...field, type: "password" as const, required: false }
      : field,
  );

  return {
    kind: "collection",
    slug: config.slug,
    label: entityLabel(config.labels, titleCase(config.slug), "plural"),
    singularLabel: entityLabel(config.labels, titleCase(config.slug), "singular"),
    useAsTitle: config.admin?.useAsTitle ?? "id",
    defaultColumns: config.admin?.defaultColumns ?? [config.admin?.useAsTitle ?? "id"],
    upload: Boolean(config.upload),
    auth,
    fields,
  };
}

function toGlobalSchema(config: SanitizedGlobalConfig): AdminGlobalSchema {
  return {
    kind: "global",
    slug: config.slug,
    label: typeof config.label === "string" ? config.label : titleCase(config.slug),
    fields: serializeFields(config.fields),
  };
}

export async function getCollectionSchema(
  slug: string,
): Promise<AdminCollectionSchema | null> {
  const payload = await getPayloadClient();
  const config = payload.config.collections.find((entry) => entry.slug === slug);
  return config ? toCollectionSchema(config) : null;
}

export async function getGlobalSchema(slug: string): Promise<AdminGlobalSchema | null> {
  const payload = await getPayloadClient();
  const config = payload.config.globals.find((entry) => entry.slug === slug);
  return config ? toGlobalSchema(config) : null;
}

export async function listCollectionSchemas(): Promise<AdminCollectionSchema[]> {
  const payload = await getPayloadClient();
  return payload.config.collections.map(toCollectionSchema);
}

export async function listGlobalSchemas(): Promise<AdminGlobalSchema[]> {
  const payload = await getPayloadClient();
  return payload.config.globals.map(toGlobalSchema);
}

/** Nav entries derived from the live Payload config (collections + globals). */
export async function getAdminNavFromConfig(): Promise<
  { href: string; label: string; group: string }[]
> {
  const [collections, globals] = await Promise.all([
    listCollectionSchemas(),
    listGlobalSchemas(),
  ]);

  const groupFor = (slug: string): string => {
    if (slug === "users") return "System";
    if (slug === "media" || slug === "tags") return "Library";
    if (slug === "artists" || slug === "friends") return "People";
    return "Content";
  };

  return [
    { href: "/admin", label: "Dashboard", group: "Overview" },
    ...collections.map((collection) => ({
      href: `/admin/collections/${collection.slug}`,
      label: collection.label,
      group: groupFor(collection.slug),
    })),
    ...globals.map((global) => ({
      href: `/admin/globals/${global.slug}`,
      label: global.label,
      group: "System",
    })),
  ];
}

export { collectRelationSlugs };
