import type { GlobalConfig } from "payload";

import { anyone, authenticated } from "../access";
import { richTextEditor } from "../editor";
import { linksField } from "../fields/links";
import { revalidateGlobalAfterChange } from "../hooks/revalidate";

/**
 * Site-wide switches and copy. Maintenance mode lives here so that flipping it
 * is an admin toggle rather than a deployment change — Phase 4 retires the
 * `MAINTENANCE_MODE` environment variable in favour of this field.
 */
export const SiteSettings: GlobalConfig = {
  slug: "siteSettings",
  label: "Site settings",
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    group: "System",
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange("siteSettings")],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Status",
          fields: [
            {
              name: "maintenanceMode",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description:
                  "Serves the maintenance screen to visitors. The admin stays reachable.",
              },
            },
            {
              name: "maintenanceMessage",
              type: "textarea",
              admin: {
                condition: (data) => Boolean(data?.maintenanceMode),
              },
            },
          ],
        },
        {
          label: "Landing",
          fields: [
            {
              name: "heroTitle",
              type: "text",
            },
            {
              name: "heroTagline",
              type: "text",
            },
            {
              name: "about",
              type: "richText",
              editor: richTextEditor,
            },
            {
              name: "ogImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Default social preview image.",
              },
            },
          ],
        },
        {
          label: "Links",
          fields: [linksField("Social links")],
        },
      ],
    },
  ],
};
