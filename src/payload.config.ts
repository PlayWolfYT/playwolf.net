import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { migrations } from "./migrations";
import { Artists } from "./payload/collections/Artists";
import { Artworks } from "./payload/collections/Artworks";
import { Characters } from "./payload/collections/Characters";
import { Friends } from "./payload/collections/Friends";
import { Media } from "./payload/collections/Media";
import { Projects } from "./payload/collections/Projects";
import { Tags } from "./payload/collections/Tags";
import { Users } from "./payload/collections/Users";
import { richTextEditor } from "./payload/editor";
import { SiteSettings } from "./payload/globals/SiteSettings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * This module is also evaluated by `next build` and by the Payload CLI, neither
 * of which has (or needs) production credentials. Missing values therefore fall
 * through to Payload's own startup errors rather than failing the build here.
 */
const databaseUrl = process.env.DATABASE_URL ?? "";
const payloadSecret = process.env.PAYLOAD_SECRET ?? "";

/**
 * Garage is S3-compatible but, like every self-hosted S3, addresses buckets by
 * path rather than by subdomain — hence `forcePathStyle`. Its region is
 * cosmetic; it just has to match what the bucket was created with.
 */
const storage = s3Storage({
  bucket: process.env.S3_BUCKET ?? "playwolf-media",
  collections: { media: true },
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    endpoint: process.env.S3_ENDPOINT ?? "http://garage:3900",
    forcePathStyle: true,
    region: process.env.S3_REGION ?? "garage",
  },
});

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " · playwolf.net",
    },
    user: Users.slug,
  },
  collections: [Users, Media, Artists, Friends, Tags, Characters, Artworks, Projects],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
    /**
     * Applied automatically on connect when NODE_ENV is production. The runtime
     * image is Next's standalone output — it has neither the repository source
     * nor the Payload CLI — so migrating from inside the running container is
     * the only option that does not mean shipping a second image.
     *
     * In development the adapter pushes schema changes directly instead; run
     * `bun run migrate:create` once a change is settled to record it here.
     */
    prodMigrations: migrations,
  }),
  editor: richTextEditor,
  globals: [SiteSettings],
  plugins: [storage],
  secret: payloadSecret,
  // sharp powers both the upload derivatives and the blur placeholder hook.
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
