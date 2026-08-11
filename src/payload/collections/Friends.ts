import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { richTextEditor } from "../editor";
import { linksField } from "../fields/links";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("friends", { extraTags: bySlug });

/**
 * Other people's characters that show up in artwork. A collection rather than
 * a flavour of tag, because a friend needs a picture and a blurb to render as
 * a proper card — a bare label can't do that.
 */
export const Friends: CollectionConfig = {
  slug: "friends",
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
    {
      name: "image",
      type: "upload",
      relationTo: "friend-images",
      admin: {
        description:
          "Portrait beside featured artwork. Upload under Friend images — crop is locked to 4:5 to match the site card (~960×1200).",
      },
    },
    {
      name: "description",
      type: "richText",
      editor: richTextEditor,
    },
    linksField(),
  ],
};
