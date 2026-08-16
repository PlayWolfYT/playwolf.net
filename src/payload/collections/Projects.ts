import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { richTextEditor } from "../editor";
import { linksField } from "../fields/links";
import { slugField } from "../fields/slug";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("projects", {
  extraTags: bySlug,
});

/**
 * Portfolio entries behind `/projects`. Separate from artworks because these
 * are things built rather than things drawn — they have a write-up, a status
 * and their own links, and they are not tied to a character.
 */
export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["title", "status", "year", "updatedAt"],
    group: "Content",
    useAsTitle: "title",
  },
  hooks: { afterChange, afterDelete },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField({ from: "title" }),
    {
      name: "summary",
      type: "textarea",
      admin: {
        description: "One or two lines, shown on the card and in link previews.",
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "project-images",
      admin: {
        description:
          "Card / hero cover. Upload under Project images — crop is locked to 16:9 to match the project cards.",
      },
    },
    {
      name: "body",
      type: "richText",
      editor: richTextEditor,
      admin: {
        description: "The full write-up, shown on the project's own page.",
      },
    },
    linksField("Project links"),
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          defaultValue: "live",
          options: [
            { label: "Live", value: "live" },
            { label: "In progress", value: "wip" },
            { label: "Coming soon", value: "planned" },
            { label: "Archived", value: "archived" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "year",
          type: "number",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Show on the landing page's work grid.",
        position: "sidebar",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      // Sort key for /projects and the landing page's work grid.
      index: true,
      admin: {
        description: "Lower sorts first.",
        position: "sidebar",
      },
    },
  ],
};
