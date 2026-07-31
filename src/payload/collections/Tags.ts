import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("tags", { extraTags: bySlug });

/**
 * Deliberately plain: a label and a slug. Tags exist so that faceted browsing
 * has stable identities to group by — anything richer belongs in `friends` or
 * `characters` instead.
 *
 * New tags are created inline from the artwork editor (the relationship field
 * there allows it), so this list rarely needs visiting directly.
 */
export const Tags: CollectionConfig = {
  slug: "tags",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["label", "slug"],
    group: "Library",
    useAsTitle: "label",
  },
  hooks: { afterChange, afterDelete },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      admin: {
        description: "Shown on chips and facet filters, e.g. “beach”.",
      },
    },
    slugField({ from: "label" }),
  ],
};
