import type { FieldAccess, GlobalConfig } from "payload";

import { sendNotification } from "../../lib/notify";
import { anyone, authenticated } from "../access";
import { richTextEditor } from "../editor";
import { linksField } from "../fields/links";
import { withAdminCondition } from "../fields/adminCondition";
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
  endpoints: [
    {
      path: "/test-notification",
      method: "post",
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        const settings = await req.payload.findGlobal({
          slug: "siteSettings",
          overrideAccess: true,
          req,
        });

        const result = await sendNotification(settings.notifications, {
          title: "playwolf.net test notification",
          message:
            "This is a test notification from the Site Settings admin. If you received it, delivery is working.",
          priority: 3,
        });

        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  ],
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
            withAdminCondition(
              { name: "maintenanceMessage", type: "textarea" },
              (data) => Boolean(data?.maintenanceMode),
            ),
            withAdminCondition(
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
              name: "testNotification",
              type: "ui",
              label: "Test notification",
              admin: {
                components: {
                  Field:
                    "@/payload/components/TestNotificationButton#TestNotificationButton",
                },
              },
            },
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
