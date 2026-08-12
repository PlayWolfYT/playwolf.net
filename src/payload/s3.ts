import type { S3ClientConfig } from "@aws-sdk/client-s3";

/**
 * Single source of truth for the object store. Two consumers need to agree on
 * it: the `s3Storage(...)` plugin in [src/payload.config.ts](src/payload.config.ts),
 * which owns the public media objects, and `src/payload/originals/store.ts`,
 * which keeps the untouched upload for every framed image under its own prefix
 * in the same bucket. Duplicating the env plumbing between them is how the two
 * would quietly drift onto different buckets.
 *
 * Like the rest of the config this module is also evaluated by `next build` and
 * by the Payload CLI, where credentials are neither present nor needed, so
 * missing values fall through as empty strings instead of throwing here.
 */
export const S3_BUCKET = process.env.S3_BUCKET ?? "playwolf-media";

/**
 * Garage is S3-compatible but, like every self-hosted S3, addresses buckets by
 * path rather than by subdomain — hence `forcePathStyle`. Its region is
 * cosmetic; it just has to match what the bucket was created with.
 */
export const s3ClientConfig: S3ClientConfig = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
  endpoint: process.env.S3_ENDPOINT ?? "http://garage:3900",
  forcePathStyle: true,
  region: process.env.S3_REGION ?? "garage",
};
