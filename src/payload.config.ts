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
import {
  CharacterImages,
  FriendImages,
  ProjectImages,
  SiteImages,
} from "./payload/collections/croppedUpload";
import { Friends } from "./payload/collections/Friends";
import { Media } from "./payload/collections/Media";
import { Projects } from "./payload/collections/Projects";
import { Tags } from "./payload/collections/Tags";
import { Users } from "./payload/collections/Users";
import { richTextEditor } from "./payload/editor";
import { SiteSettings } from "./payload/globals/SiteSettings";
import { S3_BUCKET, s3ClientConfig } from "./payload/s3";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * This module is also evaluated by `next build` and by the Payload CLI, neither
 * of which has (or needs) production credentials. Missing values therefore fall
 * through to Payload's own startup errors rather than failing the build here.
 */
const databaseUrl = process.env.DATABASE_URL ?? "";
const payloadSecret = process.env.PAYLOAD_SECRET ?? "";

/**
 * The origin this deployment answers on. `serverURL` is what lets server-side
 * code build absolute URLs without trusting a request's `Origin`/`Host`, and it
 * is the single source both allow-lists below derive from.
 *
 * Setting it has one non-obvious consequence: Payload's `url` field on every
 * upload switches from a relative path to `${serverURL}/api/{collection}/file/…`.
 * `next/image` treats any absolute URL as remote, so the site origin has to be
 * present in `images.remotePatterns` in `next.config.ts` or every image render
 * throws "Invalid src prop".
 */
const siteURL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

/**
 * An *empty* `csrf` list makes Payload's cookie strategy accept a session
 * cookie presented from any `Origin`, so the list has to be non-empty to mean
 * anything. It must also not be a single origin outside production: the site
 * URL routinely points at `https://playwolf.net` even locally (that is what
 * `.env.example` ships), and the admin is then reached from
 * `http://localhost:3000`, whose cookie the CSRF check would reject — locking
 * the operator out of local admin entirely. Hence the loopback origin in dev.
 *
 * Payload's own sanitize step appends `serverURL` to both lists, so the
 * de-duplication here only covers what this file contributes.
 */
const origins = Array.from(
  new Set(
    process.env.NODE_ENV === "production"
      ? [siteURL]
      : [siteURL, "http://localhost:3000"],
  ),
);

/**
 * Hard ceiling on an upload, enforced while the multipart body is still being
 * parsed — so an oversized file is never buffered, never handed to sharp and
 * never stored. Comfortably above the largest reference-sheet original this
 * site has seen; raise it here if a legitimate upload ever hits it.
 *
 * `abortOnLimit` is what stops the request rather than letting a `truncated`
 * file through. Payload builds a 413 for it but loses the status on the way
 * out (aborting the stream rejects its own parse promise first), so the client
 * actually sees a 500 and the log gets one "Unexpected end of form" unhandled
 * rejection per attempt. Both are cosmetic — the request is refused either way.
 */
const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

/**
 * Bucket and client settings come from `./payload/s3` so the sidecar store for
 * pristine originals talks to exactly the same endpoint and credentials.
 */
const storage = s3Storage({
  bucket: S3_BUCKET,
  collections: {
    media: true,
    "friend-images": true,
    "character-images": true,
    "project-images": true,
    "site-images": true,
  },
  config: s3ClientConfig,
});

export default buildConfig({
  admin: {
    /**
     * Payload's built-in avatar instead of the default Gravatar one. Gravatar
     * is fetched from the browser on every admin page load, which both tells a
     * third party when the operator is working and hands it an MD5 of the
     * account email; the admin CSP had to allow that origin to boot.
     */
    avatar: "default",
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " · playwolf.net",
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    FriendImages,
    CharacterImages,
    ProjectImages,
    SiteImages,
    Artists,
    Friends,
    Tags,
    Characters,
    Artworks,
    Projects,
  ],
  /**
   * Renames the session cookie away from the generic `payload-token`. Purely
   * cosmetic, but it means a cookie on this domain is identifiable.
   */
  cookiePrefix: "playwolf",
  cors: origins,
  csrf: origins,
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
  serverURL: siteURL,
  // sharp powers both the upload derivatives and the blur placeholder hook.
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  upload: {
    abortOnLimit: true,
    limits: { fileSize: MAX_UPLOAD_BYTES },
  },
});
