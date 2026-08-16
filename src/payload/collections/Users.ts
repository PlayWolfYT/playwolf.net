import type { CollectionConfig } from "payload";

import { authenticated, authenticatedAdmin } from "../access";

/**
 * Admin accounts. Payload owns sessions, password hashing and login rate
 * limiting; the first visit to `/admin` on an empty database runs the
 * create-first-user flow, so no seeding command is needed.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 8,
    lockTime: 1000 * 60 * 10,
    cookies: {
      /**
       * `Lax`, not `Strict`: the admin is routinely entered by top-level
       * navigation from outside the site (a bookmark, a link in a mail), and
       * `Strict` would withhold the cookie on exactly that first request and
       * bounce the operator to the login screen. `secure` is conditional
       * because local dev is plain HTTP and a Secure cookie would never be
       * stored there.
       */
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  access: {
    admin: authenticatedAdmin,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    unlock: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["name", "email"],
    group: "System",
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
  timestamps: true,
};
