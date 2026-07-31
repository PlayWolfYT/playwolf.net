import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { linksField } from "../fields/links";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("artists", { extraTags: bySlug });

/**
 * Who drew a piece. `links` is an ordered array rather than the keyed blob the
 * old `artists.ts` used, so the display order is explicit and artists with two
 * Telegrams stop being a special case.
 */
export const Artists: CollectionConfig = {
  slug: "artists",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "People",
    useAsTitle: "name",
  },
  hooks: { afterChange, afterDelete },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField(),
    linksField(),
  ],
};
