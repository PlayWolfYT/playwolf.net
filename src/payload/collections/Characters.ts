import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { profileField } from "../fields/profile";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("characters", {
  extraTags: bySlug,
});

/** Own characters. Drives `/ref/<slug>` and everything nested beneath it. */
export const Characters: CollectionConfig = {
  slug: "characters",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["name", "slug", "species", "updatedAt"],
    group: "Content",
    useAsTitle: "name",
  },
  hooks: { afterChange, afterDelete },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "species",
          type: "text",
          admin: {
            description: "e.g. Husky/Shepherd-Mix",
            width: "50%",
          },
        },
      ],
    },
    slugField(),
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Lower sorts first on the /ref overview.",
        position: "sidebar",
      },
    },
    {
      name: "mainArt",
      type: "group",
      label: "Main art",
      admin: {
        description:
          "Hero image for the overview card and embeds. Falls back to the first image reference sheet when empty.",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "character-images",
          admin: {
            description:
              "Overview / card portrait. Upload under Character images to crop the frame. Reference sheets stay on Media.",
          },
        },
        {
          name: "alt",
          type: "text",
          admin: {
            description: "Defaults to the character's name.",
          },
        },
        {
          name: "artist",
          type: "relationship",
          relationTo: "artists",
        },
      ],
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "SFW",
          fields: [profileField("sfw", "SFW")],
        },
        {
          label: "After Dark",
          fields: [profileField("nsfw", "After Dark")],
        },
      ],
    },
  ],
};
