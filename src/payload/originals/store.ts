import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { S3_BUCKET, s3ClientConfig } from "../s3";

/**
 * Sidecar storage for the pristine bytes of framed uploads.
 *
 * Payload's crop tool rewrites the stored file, so a second crop compounds on
 * the first and pixels outside the previous selection are gone for good. To
 * make cropping non-destructive we copy every incoming upload to a private
 * object under `originals/` and re-derive the public file from it on each save.
 *
 * These objects live in the same bucket as the media the S3 storage plugin
 * manages, but deliberately outside the prefixes it owns: the plugin maps a
 * collection to `<filename>` keys, so a distinct top-level prefix keeps the
 * sidecars from ever colliding with a public object — and keeps them out of the
 * public URL space, since only the auth-gated admin route reads them back.
 *
 * Keys are `originals/<collection>/<uuid>.<ext>`. A UUID rather than the
 * upload's filename because the filename can change (Payload deduplicates,
 * and the extension changes to `.webp` once a crop is applied) while this
 * object must stay reachable through the `source.key` on the document.
 */
export const ORIGINALS_PREFIX = "originals";

export type StoredOriginal = {
  body: Buffer;
  contentType?: string;
};

/**
 * One client for the process. The SDK's client is a thin, thread-safe wrapper
 * around a connection pool, and constructing one per request would throw that
 * pool away on every save.
 */
let client: S3Client | undefined;

function s3(): S3Client {
  client ??= new S3Client(s3ClientConfig);
  return client;
}

/** Lowercased extension without the dot, or `bin` when there is nothing usable. */
function extensionFor(filename: string | null | undefined): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename?.trim() ?? "");
  return match ? match[1].toLowerCase() : "bin";
}

export function buildOriginalKey(collection: string, filename?: string | null): string {
  return `${ORIGINALS_PREFIX}/${collection}/${randomUUID()}.${extensionFor(filename)}`;
}

export async function putOriginal(
  key: string,
  body: Buffer,
  contentType?: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Reads a sidecar back into memory. Buffered rather than streamed because every
 * caller (sharp, and the admin's crop drawer) needs the whole image anyway.
 *
 * Returns `null` when the object is gone, which is a recoverable state rather
 * than an error: a document whose sidecar was pruned falls back to adopting its
 * current main file as the original.
 */
export async function getOriginal(key: string): Promise<StoredOriginal | null> {
  try {
    const result = await s3().send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    if (!result.Body) return null;
    return {
      body: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType,
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Deleting an object that is already gone is a success, per S3 semantics. */
export async function deleteOriginal(key: string): Promise<void> {
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (error) {
    if (isNotFound(error)) return;
    throw error;
  }
}

/**
 * Garage answers a missing key with `NoSuchKey`, but signature-style errors from
 * other S3 implementations only carry the status code, so check both.
 */
function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === "NoSuchKey" ||
    candidate.name === "NotFound" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}
