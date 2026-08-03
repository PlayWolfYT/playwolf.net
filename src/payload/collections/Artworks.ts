import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("artworks", {
  extraTags: bySlug,
});

/**
 * A relationship reaches a hook either as a bare id or as the resolved
 * document, depending on the depth of the operation that triggered it.
 */
function idOf(value: unknown): number | undefined {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return value.trim() === "" || Number.isNaN(parsed) ? undefined : parsed;
  }

  if (value && typeof value === "object" && "id" in value) {
    return idOf((value as { id: unknown }).id);
  }

  return undefined;
}

/** One entry of a polymorphic `hasMany` relationship, as Payload stores it. */
function isPolymorphicValue(
  entry: unknown,
): entry is { relationTo: string; value: unknown } {
  return typeof entry === "object" && entry !== null && "relationTo" in entry;
}

/**
 * A single piece of art. Its own collection because it is what gets added most
 * often — one form per upload rather than editing a growing array inside a
 * character.
 */
export const Artworks: CollectionConfig = {
  slug: "artworks",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["title", "character", "profile", "artist", "updatedAt"],
    group: "Content",
    useAsTitle: "title",
  },
  hooks: { afterChange, afterDelete },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description:
          "Just the subject. Who else is in the picture belongs in “Also featuring”, not the title.",
      },
    },
    // Two characters may each have a "hug", so uniqueness is scoped by the
    // character + profile pair in the URL rather than enforced site-wide.
    slugField({ from: "title", unique: false }),
    {
      type: "row",
      fields: [
        {
          name: "character",
          type: "relationship",
          relationTo: "characters",
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "profile",
          type: "select",
          required: true,
          defaultValue: "sfw",
          options: [
            { label: "SFW", value: "sfw" },
            { label: "After Dark", value: "nsfw" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "artist",
      type: "relationship",
      relationTo: "artists",
    },
    {
      // Polymorphic on purpose: one field covers both own characters and
      // friends, and Payload stores each entry as `{ relationTo, value }` so
      // the frontend knows which collection to link into. This replaces the
      // old convention of encoding people into titles like "Hug (with Taire)",
      // and makes "every picture Taire appears in" a real query.
      //
      // The subject above is deliberately absent: it is always in the picture,
      // so the frontend prepends it rather than asking for it twice.
      name: "featuring",
      type: "relationship",
      relationTo: ["characters", "friends"],
      hasMany: true,
      label: "Also featuring",
      admin: {
        description:
          "Everyone else in the picture. The character above is always featured.",
      },
      filterOptions: ({ relationTo, data }) => {
        const subject = idOf(data?.character);
        // `relationTo` is the collection being searched, so the id constraint
        // only ever applies to the side it can mean anything on.
        if (relationTo !== "characters" || subject === undefined) return true;
        return { id: { not_equals: subject } };
      },
      hooks: {
        // Keeps what is stored canonical even for writes that bypass the admin
        // (REST, GraphQL, the Local API), so nothing has to dedupe on read.
        beforeValidate: [
          ({ value, data, originalDoc }) => {
            const subject = idOf(data?.character ?? originalDoc?.character);
            if (!Array.isArray(value) || subject === undefined) return value;

            return value.filter(
              (entry) =>
                !(
                  isPolymorphicValue(entry) &&
                  entry.relationTo === "characters" &&
                  idOf(entry.value) === subject
                ),
            );
          },
        ],
      },
    },
    {
      // `allowCreate` (on by default) is what makes this behave like a tag box:
      // type-to-search over existing tags, with inline creation for new ones.
      // A plain `text` field with `hasMany` would be faster to type into but
      // has no shared registry, so a typo silently forks a facet.
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Lower sorts first within the profile's gallery.",
        position: "sidebar",
      },
    },
  ],
};
