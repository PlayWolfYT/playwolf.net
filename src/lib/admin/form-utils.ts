import { LINK_KINDS, type LinkKind } from "@/payload/fields/links";

/**
 * Pure `FormData` → Payload data helpers shared by every admin server action.
 * Kept dependency-free (no Payload, no Next) so they are cheap to unit test.
 */

export type LinkInput = {
  kind: LinkKind;
  url: string;
  description?: string;
};

/** Trimmed string, or `undefined` for blank/missing so it clears the field. */
export function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Same as `str`, but keeps an explicit empty string rather than `undefined`. */
export function strOrEmpty(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Raw string, untrimmed — for free-form text areas where leading space matters. */
export function raw(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Checkbox presence. Native checkboxes only appear in `FormData` when checked. */
export function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

/** Parses a number field, or `undefined` when blank/invalid. */
export function num(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Parses an id field (a positive integer), or `undefined`. */
export function id(formData: FormData, key: string): number | undefined {
  const parsed = num(formData, key);
  return parsed !== undefined && parsed > 0 ? Math.trunc(parsed) : undefined;
}

/**
 * Same as `id`, but returns `null` (not `undefined`) when blank. Payload's
 * update keeps a field untouched when it is absent from `data` but clears it
 * when given `null` — this is for relationship/upload fields whose form
 * control (e.g. `MediaPicker`) is always rendered, so a blank submission is
 * an explicit "cleared", not "was never asked about".
 */
export function idOrNull(formData: FormData, key: string): number | null {
  return id(formData, key) ?? null;
}

/**
 * Parses a JSON blob written by a client array-editor into a hidden input.
 * Missing/blank/invalid JSON all fall back to the given default rather than
 * throwing — a save should never fail because a picker was never touched.
 */
export function parseJSON<T>(formData: FormData, key: string, fallback: T): T {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** A list of relationship ids (e.g. tags), from a JSON-encoded hidden input. */
export function parseIdList(formData: FormData, key: string): number[] {
  const raw = parseJSON<unknown>(formData, key, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value) && value > 0);
}

/**
 * A single relationship id from a `RelationshipPicker` in non-multiple mode
 * (a JSON-encoded array of at most one value). Returns `null` when cleared,
 * matching `idOrNull`'s "the control is always rendered" contract.
 */
export function parseSingleId(formData: FormData, key: string): number | null {
  return parseIdList(formData, key)[0] ?? null;
}

/** A list of plain strings, from a JSON-encoded hidden input (icons/quotes/etc.). */
export function parseStringList(formData: FormData, key: string): string[] {
  const raw = parseJSON<unknown>(formData, key, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function isLinkKind(value: unknown): value is LinkKind {
  return typeof value === "string" && (LINK_KINDS as readonly string[]).includes(value);
}

/** Validates a links array submitted by `LinksEditor`. */
export function parseLinks(formData: FormData, key: string): LinkInput[] {
  const raw = parseJSON<unknown>(formData, key, []);
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const kind = (entry as Record<string, unknown>).kind;
    const url = (entry as Record<string, unknown>).url;
    const description = (entry as Record<string, unknown>).description;
    if (!isLinkKind(kind) || typeof url !== "string" || url.trim() === "") return [];

    return [
      {
        kind,
        url: url.trim(),
        description:
          typeof description === "string" && description.trim() !== ""
            ? description.trim()
            : undefined,
      },
    ];
  });
}

export type PolymorphicRelation = { relationTo: string; value: number };

/**
 * A polymorphic `hasMany` relationship (e.g. artwork `featuring`), from a
 * JSON-encoded `{ relationTo, value }[]` hidden input.
 */
export function parsePolymorphicList(
  formData: FormData,
  key: string,
  allowedCollections: readonly string[],
): PolymorphicRelation[] {
  const raw = parseJSON<unknown>(formData, key, []);
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const relationTo = (entry as Record<string, unknown>).relationTo;
    const value = Number((entry as Record<string, unknown>).value);
    if (
      typeof relationTo !== "string" ||
      !allowedCollections.includes(relationTo) ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return [];
    }
    return [{ relationTo, value }];
  });
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Builds the query string a list/edit page reads to render a flash message. */
export function flashUrl(path: string, flash: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}flash=${encodeURIComponent(flash)}`;
}
