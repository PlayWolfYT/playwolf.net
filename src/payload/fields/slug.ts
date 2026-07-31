import type { Field, FieldHook } from "payload";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase, strip accents, collapse anything non-alphanumeric into hyphens. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fills an empty slug from another field so the common case needs no typing,
 * while a hand-written slug is left exactly as entered (and validated).
 */
function fillFromSource(sourceField: string): FieldHook {
  return ({ data, siblingData, value }) => {
    if (typeof value === "string" && value.length > 0) return slugify(value);

    const source = (siblingData?.[sourceField] ?? data?.[sourceField]) as unknown;
    return typeof source === "string" ? slugify(source) : value;
  };
}

type SlugFieldOptions = {
  /** Field the slug is derived from when left blank. */
  from?: string;
  /**
   * Artwork slugs only need to be unique within a character's profile, so that
   * two characters can each have a "hug". Everything else is unique site-wide.
   */
  unique?: boolean;
};

/**
 * URL segment for a document. Replaces the compile-time `ValidateSlug` type
 * that the file-based content used — the same rule, enforced at write time.
 */
export function slugField({
  from = "name",
  unique = true,
}: SlugFieldOptions = {}): Field {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique,
    index: true,
    admin: {
      position: "sidebar",
      description: "URL segment. Lowercase letters, digits and hyphens only.",
    },
    hooks: {
      beforeValidate: [fillFromSource(from)],
    },
    validate: (value: unknown) => {
      if (typeof value !== "string" || value.length === 0) {
        return "A slug is required.";
      }
      return SLUG_PATTERN.test(value)
        ? true
        : "Use lowercase letters, digits and single hyphens (e.g. `after-dark`).";
    },
  };
}
