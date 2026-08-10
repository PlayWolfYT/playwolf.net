import { equalsPlain, plaintextToLexical, richTextToPlain } from "@/lib/admin/lexical";
import type { AdminField } from "@/lib/admin/schema";
import type { RichTextValue } from "@/lib/content";

/** Marker stored in form state for rich-text fields edited as plain text. */
export type StudioRichText = {
  __studioPlain: string;
  __studioOriginal: RichTextValue | null;
};

export function isStudioRichText(value: unknown): value is StudioRichText {
  return (
    typeof value === "object" &&
    value !== null &&
    "__studioPlain" in value &&
    "__studioOriginal" in value
  );
}

function idOf(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (value && typeof value === "object" && "id" in value) {
    return idOf((value as { id: unknown }).id);
  }
  return null;
}

function relationValue(value: unknown, polymorphic: boolean): unknown {
  if (value == null) return polymorphic ? [] : null;

  if (polymorphic) {
    const list = Array.isArray(value) ? value : [value];
    return list.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const relationTo = (entry as { relationTo?: unknown }).relationTo;
      const nested = (entry as { value?: unknown }).value;
      const id = idOf(nested);
      if (typeof relationTo !== "string" || id == null) return [];
      return [{ relationTo, value: id }];
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => idOf(entry)).filter((entry) => entry != null);
  }

  return idOf(value);
}

/**
 * Shape a stored Payload document for the schema form: relationships become
 * ids, uploads become ids, rich text becomes a plain/original pair.
 */
export function documentToFormValues(
  doc: Record<string, unknown> | null | undefined,
  fields: AdminField[],
): Record<string, unknown> {
  const source = doc ?? {};
  const out: Record<string, unknown> = {};

  const walk = (
    list: AdminField[],
    from: Record<string, unknown>,
    into: Record<string, unknown>,
  ) => {
    for (const field of list) {
      if (field.type === "tabs") {
        for (const tab of field.tabs ?? []) walk(tab.fields, from, into);
        continue;
      }
      if (field.type === "row" || field.type === "collapsible") {
        walk(field.fields ?? [], from, into);
        continue;
      }
      if (!field.name) {
        if (field.type === "group") walk(field.fields ?? [], from, into);
        continue;
      }

      const raw = from[field.name];

      if (field.type === "group") {
        const groupValue =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
        const nested: Record<string, unknown> = {};
        walk(field.fields ?? [], groupValue, nested);
        into[field.name] = nested;
        continue;
      }

      if (field.type === "array") {
        const rows = Array.isArray(raw) ? raw : [];
        into[field.name] = rows.map((row) => {
          const rowObj =
            row && typeof row === "object" ? (row as Record<string, unknown>) : {};
          const nested: Record<string, unknown> = {};
          walk(field.fields ?? [], rowObj, nested);
          if ("id" in rowObj) nested.id = rowObj.id;
          return nested;
        });
        continue;
      }

      if (field.type === "relationship" || field.type === "upload") {
        const polymorphic = Array.isArray(field.relationTo);
        into[field.name] = relationValue(raw, polymorphic && Boolean(field.hasMany));
        // Polymorphic hasMany uses {relationTo,value}[]; single polymorphic is rare here.
        if (polymorphic && field.hasMany) {
          into[field.name] = relationValue(raw, true);
        } else if (field.hasMany) {
          into[field.name] = relationValue(raw, false);
        } else {
          into[field.name] = relationValue(raw, false);
        }
        continue;
      }

      if (field.type === "richText") {
        const original = (raw as RichTextValue | null | undefined) ?? null;
        into[field.name] = {
          __studioPlain: richTextToPlain(original),
          __studioOriginal: original,
        } satisfies StudioRichText;
        continue;
      }

      if (field.type === "checkbox") {
        into[field.name] = Boolean(raw ?? field.defaultValue ?? false);
        continue;
      }

      if (raw === undefined && field.defaultValue !== undefined) {
        into[field.name] = field.defaultValue;
        continue;
      }

      into[field.name] = raw ?? null;
    }
  };

  walk(fields, source, out);
  return out;
}

/**
 * Convert form state back into a Payload `data` object. Rich-text plain
 * markers become Lexical documents (preserving the original when unchanged).
 */
export function formValuesToDocument(
  values: Record<string, unknown>,
  fields: AdminField[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const walk = (
    list: AdminField[],
    from: Record<string, unknown>,
    into: Record<string, unknown>,
  ) => {
    for (const field of list) {
      if (field.type === "tabs") {
        for (const tab of field.tabs ?? []) walk(tab.fields, from, into);
        continue;
      }
      if (field.type === "row" || field.type === "collapsible") {
        walk(field.fields ?? [], from, into);
        continue;
      }
      if (!field.name) {
        if (field.type === "group") walk(field.fields ?? [], from, into);
        continue;
      }

      const raw = from[field.name];

      if (field.type === "group") {
        const groupValue =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
        const nested: Record<string, unknown> = {};
        walk(field.fields ?? [], groupValue, nested);
        into[field.name] = nested;
        continue;
      }

      if (field.type === "array") {
        const rows = Array.isArray(raw) ? raw : [];
        into[field.name] = rows.map((row) => {
          const rowObj =
            row && typeof row === "object" ? (row as Record<string, unknown>) : {};
          const nested: Record<string, unknown> = {};
          walk(field.fields ?? [], rowObj, nested);
          return nested;
        });
        continue;
      }

      if (field.type === "richText") {
        if (isStudioRichText(raw)) {
          into[field.name] = equalsPlain(raw.__studioOriginal, raw.__studioPlain)
            ? raw.__studioOriginal
            : plaintextToLexical(raw.__studioPlain);
        } else if (typeof raw === "string") {
          into[field.name] = plaintextToLexical(raw);
        } else {
          into[field.name] = raw ?? null;
        }
        continue;
      }

      if (field.type === "password") {
        if (typeof raw === "string" && raw.length > 0) into[field.name] = raw;
        continue;
      }

      if (field.type === "number") {
        if (raw === "" || raw === null || raw === undefined) {
          into[field.name] = null;
        } else {
          const parsed = Number(raw);
          into[field.name] = Number.isFinite(parsed) ? parsed : null;
        }
        continue;
      }

      if (field.type === "upload" || field.type === "relationship") {
        if (raw === "" || raw === undefined) {
          into[field.name] = field.hasMany ? [] : null;
        } else {
          into[field.name] = raw;
        }
        continue;
      }

      into[field.name] = raw;
    }
  };

  walk(fields, values, out);
  return out;
}
