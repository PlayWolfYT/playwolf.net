import type { FieldAccess, GlobalConfig } from "payload";

import { anyone, authenticated } from "../access";
import { richTextEditor } from "../editor";
import { linksField } from "../fields/links";
import { withStudioCondition } from "../fields/studioCondition";
import { revalidateGlobalAfterChange } from "../hooks/revalidate";

/** Secrets stay off unauthenticated reads (REST/GraphQL/local without a user). */
const authenticatedField: FieldAccess = ({ req }) => Boolean(req.user);

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
            withStudioCondition(
              { name: "maintenanceMessage", type: "textarea" },
              { kind: "rootTruthy", field: "maintenanceMode" },
              (data) => Boolean(data?.maintenanceMode),
            ),
            withStudioCondition(
              {
                name: "maintenanceExcludedPaths",
                type: "text",
                hasMany: true,
                defaultValue: ["/ref"],
                admin: {
                  description:
                    "Path prefixes that stay reachable during maintenance (exact match or subpaths). Defaults to /ref. Clear the list to put every public route behind the screen.",
                },
              },
              { kind: "rootTruthy", field: "maintenanceMode" },
              (data) => Boolean(data?.maintenanceMode),
            ),
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
        {
          label: "Notifications",
          fields: [
            {
              name: "notifications",
              type: "group",
              access: {
                read: authenticatedField,
                update: authenticatedField,
              },
              fields: [
                {
                  name: "channel",
                  type: "select",
                  defaultValue: "ntfy",
                  options: [
                    { label: "ntfy", value: "ntfy" },
                    { label: "SMTP email", value: "smtp" },
                    { label: "Both", value: "both" },
                  ],
                  admin: {
                    description:
                      "Which channels to use. “Both” tries each configured channel; if ntfy is not configured, SMTP is used as the fallback.",
                  },
                },
                {
                  name: "ntfy",
                  type: "group",
                  label: "ntfy",
                  fields: [
                    {
                      name: "serverUrl",
                      type: "text",
                      admin: {
                        description: "e.g. https://ntfy.sh",
                        placeholder: "https://ntfy.sh",
                      },
                    },
                    {
                      name: "topic",
                      type: "text",
                    },
                    {
                      name: "token",
                      type: "text",
                      admin: {
                        description: "Optional access token (secret).",
                      },
                    },
                  ],
                },
                {
                  name: "smtp",
                  type: "group",
                  label: "SMTP",
                  fields: [
                    {
                      name: "host",
                      type: "text",
                    },
                    {
                      name: "port",
                      type: "number",
                      defaultValue: 587,
                    },
                    {
                      name: "secure",
                      type: "checkbox",
                      defaultValue: false,
                      admin: {
                        description: "Use TLS (typically for port 465).",
                      },
                    },
                    {
                      name: "user",
                      type: "text",
                    },
                    {
                      name: "password",
                      type: "text",
                      admin: {
                        description: "SMTP password (secret).",
                      },
                    },
                    {
                      name: "from",
                      type: "text",
                      label: "From address",
                    },
                    {
                      name: "to",
                      type: "text",
                      label: "To address",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
