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
