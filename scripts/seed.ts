import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import config from "@payload-config";
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  File,
  Payload,
  RequiredDataFromCollectionSlug,
  Where,
} from "payload";
import { getPayload } from "payload";
import sharp from "sharp";

import {
  CACHE_REVALIDATION_PATH,
  createCacheRevalidationToken,
} from "../src/lib/cache-revalidation";
import type { SiteSetting } from "../src/payload-types";
import { S3_BUCKET, s3ClientConfig } from "../src/payload/s3";

// Standalone scripts never need to subscribe to Next's development HMR socket.
process.env.DISABLE_PAYLOAD_HMR = "true";

const DEFAULT_ADMIN_EMAIL = "testing@testing.com";
const DEFAULT_ADMIN_PASSWORD = "testing";

/**
 * Payload plugins mutate request context (cloud storage preserves req.file in
 * `_payloadCloudStorage`). Every operation therefore needs its own object;
 * sharing one causes every upload after the first to reuse stale file state.
 */
function seedContext(): { disableRevalidate: true } {
  return { disableRevalidate: true };
}

type SeedCollectionSlug =
  "artists" | "artworks" | "characters" | "friends" | "projects" | "tags" | "users";

type SlugSeedCollectionSlug = Exclude<SeedCollectionSlug, "artworks" | "users">;

type SlugScenario<TSlug extends SlugSeedCollectionSlug> = {
  data: RequiredDataFromCollectionSlug<TSlug> & { slug: string };
  key: string;
};

type UploadCollectionSlug =
  "character-images" | "friend-images" | "media" | "project-images" | "site-images";

type SeedStats = {
  created: number;
  downloaded: number;
  repaired: number;
  updated: number;
};

type PlaceholderSpec = {
  alt: string;
  background: `#${string}`;
  caption?: string;
  collection: UploadCollectionSlug;
  filename: string;
  foreground: `#${string}`;
  height: number;
  key: string;
  text: string;
  width: number;
};

type CliOptions = {
  fresh: boolean;
  help: boolean;
};

type SeededUploadDocument = {
  filename?: null | string;
  sizes?: null | Record<string, null | { filename?: null | string }>;
  source?: null | { key?: null | string };
  url?: null | string;
};

const storageClient = new S3Client(s3ClientConfig);

const PLACEHOLDERS: readonly PlaceholderSpec[] = [
  {
    key: "site-og",
    collection: "site-images",
    filename: "seed-site-open-graph.png",
    width: 1200,
    height: 630,
    background: "#111827",
    foreground: "#67E8F9",
    text: "PLAYWOLF.NET\nOPEN GRAPH PREVIEW",
    alt: "playwolf.net seed Open Graph preview",
  },
  {
    key: "ch-dual-full-portrait",
    collection: "character-images",
    filename: "seed-ch-dual-full-portrait.png",
    width: 1200,
    height: 1200,
    background: "#0E7490",
    foreground: "#ECFEFF",
    text: "CH DUAL PROFILE\nFULL + BOTH REFS",
    alt: "CH Dual Profile - Full, Both Refs portrait fixture",
  },
  {
    key: "ch-dual-wip-portrait",
    collection: "character-images",
    filename: "seed-ch-dual-wip-portrait.png",
    width: 1200,
    height: 1200,
    background: "#6D28D9",
    foreground: "#F5F3FF",
    text: "CH DUAL PROFILE\nFULL + WIP REFS",
    alt: "CH Dual Profile - Full, WIP Refs portrait fixture",
  },
  {
    key: "ch-single-nsfw-portrait",
    collection: "character-images",
    filename: "seed-ch-single-nsfw-portrait.png",
    width: 1200,
    height: 1200,
    background: "#7F1D1D",
    foreground: "#FEE2E2",
    text: "CH SINGLE NSFW PROFILE\nWITH REF",
    alt: "CH Single NSFW Profile - With Ref portrait fixture",
  },
  {
    key: "ch-single-sfw-ref-portrait",
    collection: "character-images",
    filename: "seed-ch-single-sfw-ref-portrait.png",
    width: 1200,
    height: 1200,
    background: "#166534",
    foreground: "#F0FDF4",
    text: "CH SINGLE SFW PROFILE\nWITH REF",
    alt: "CH Single SFW Profile - With Ref portrait fixture",
  },
  {
    key: "fr-full-image",
    collection: "friend-images",
    filename: "seed-fr-full-image.png",
    width: 1500,
    height: 600,
    background: "#B45309",
    foreground: "#FFFBEB",
    text: "FR FULL\nIMAGE + DESCRIPTION + LINKS",
    alt: "FR Full - Image, Description, Links banner fixture",
  },
  {
    key: "fr-partial-image",
    collection: "friend-images",
    filename: "seed-fr-partial-image.png",
    width: 1500,
    height: 600,
    background: "#047857",
    foreground: "#ECFDF5",
    text: "FR PARTIAL\nIMAGE + ONE LINK",
    alt: "FR Partial - Image and One Link banner fixture",
  },
  {
    key: "project-live",
    collection: "project-images",
    filename: "seed-project-live.png",
    width: 1600,
    height: 900,
    background: "#0369A1",
    foreground: "#F0F9FF",
    text: "PR LIVE\nFULL + FEATURED",
    alt: "PR Live - Full and Featured cover fixture",
  },
  {
    key: "project-wip",
    collection: "project-images",
    filename: "seed-project-wip.png",
    width: 1600,
    height: 900,
    background: "#7E22CE",
    foreground: "#FAF5FF",
    text: "PR WIP\nPARTIAL + FEATURED",
    alt: "PR WIP - Partial and Featured cover fixture",
  },
  {
    key: "project-archived",
    collection: "project-images",
    filename: "seed-project-archived.png",
    width: 1600,
    height: 900,
    background: "#374151",
    foreground: "#F9FAFB",
    text: "PR ARCHIVED\nFULL",
    alt: "PR Archived - Full cover fixture",
  },
  {
    key: "ch-dual-full-sfw-ref",
    collection: "media",
    filename: "seed-ch-dual-full-sfw-reference.png",
    width: 1600,
    height: 1200,
    background: "#0891B2",
    foreground: "#ECFEFF",
    text: "CH DUAL PROFILE - FULL\nSFW REFERENCE",
    alt: "CH Dual Profile - Full SFW reference fixture",
    caption: "Dual-profile full SFW reference fixture",
  },
  {
    key: "ch-dual-full-nsfw-ref",
    collection: "media",
    filename: "seed-ch-dual-full-nsfw-reference.png",
    width: 1600,
    height: 1200,
    background: "#BE185D",
    foreground: "#FDF2F8",
    text: "CH DUAL PROFILE - FULL\nNSFW REFERENCE",
    alt: "CH Dual Profile - Full NSFW reference fixture",
    caption: "Dual-profile full NSFW reference fixture",
  },
  {
    key: "ch-single-nsfw-ref",
    collection: "media",
    filename: "seed-ch-single-nsfw-reference.png",
    width: 1600,
    height: 1200,
    background: "#991B1B",
    foreground: "#FEF2F2",
    text: "CH SINGLE NSFW PROFILE\nIMAGE REFERENCE",
    alt: "CH Single NSFW Profile - With Ref reference fixture",
    caption: "Single NSFW profile image reference fixture",
  },
  {
    key: "ch-single-sfw-ref",
    collection: "media",
    filename: "seed-ch-single-sfw-reference.png",
    width: 1600,
    height: 1200,
    background: "#15803D",
    foreground: "#F0FDF4",
    text: "CH SINGLE SFW PROFILE\nIMAGE REFERENCE",
    alt: "CH Single SFW Profile - With Ref reference fixture",
    caption: "Single SFW profile image reference fixture",
  },
  {
    key: "ch-dual-mixed-sfw-ref",
    collection: "media",
    filename: "seed-ch-dual-mixed-sfw-reference.png",
    width: 1600,
    height: 1200,
    background: "#1D4ED8",
    foreground: "#EFF6FF",
    text: "CH DUAL PROFILE - MIXED\nSFW REF / NSFW NONE",
    alt: "CH Dual Profile - Mixed Refs SFW reference fixture",
    caption: "Dual-profile mixed reference fixture",
  },
  {
    key: "art-full-primary",
    collection: "media",
    filename: "seed-art-complete-full-primary.png",
    width: 1400,
    height: 1000,
    background: "#0F766E",
    foreground: "#F0FDFA",
    text: "ART COMPLETE - FULL\nPRIMARY VERSION",
    alt: "ART Complete - Full Metadata primary fixture",
  },
  {
    key: "art-cross-rating-alt",
    collection: "media",
    filename: "seed-art-complete-cross-rating-alt.png",
    width: 1400,
    height: 1000,
    background: "#9D174D",
    foreground: "#FDF2F8",
    text: "ART COMPLETE\nCROSS-RATING ALT",
    alt: "ART Complete - Cross-Rating Linked Alt fixture",
  },
  {
    key: "art-same-rating-alt",
    collection: "media",
    filename: "seed-art-complete-same-rating-alt.png",
    width: 1400,
    height: 1000,
    background: "#4338CA",
    foreground: "#EEF2FF",
    text: "ART COMPLETE\nSAME-RATING ALT",
    alt: "ART Complete - Same-Rating Linked Alt fixture",
  },
  {
    key: "art-inline-alt",
    collection: "media",
    filename: "seed-art-complete-inline-alt.png",
    width: 1400,
    height: 1000,
    background: "#C2410C",
    foreground: "#FFF7ED",
    text: "ART COMPLETE\nINLINE ALT IMAGE",
    alt: "ART Complete - Inline Alt Image fixture",
  },
  {
    key: "art-history-final",
    collection: "media",
    filename: "seed-art-complete-wip-history-final.png",
    width: 1400,
    height: 1000,
    background: "#1D4ED8",
    foreground: "#EFF6FF",
    text: "ART COMPLETE\nFINAL + WIP HISTORY",
    alt: "ART Complete - Visible WIP History final fixture",
  },
  {
    key: "art-wip-sketch-1",
    collection: "media",
    filename: "seed-art-wip-sketch-1.png",
    width: 1200,
    height: 900,
    background: "#A16207",
    foreground: "#FEFCE8",
    text: "ART WIP\nSKETCH 1",
    alt: "ART WIP - Uploaded Sketch 1 fixture",
  },
  {
    key: "art-wip-sketch-2",
    collection: "media",
    filename: "seed-art-wip-sketch-2.png",
    width: 1200,
    height: 900,
    background: "#7E22CE",
    foreground: "#FAF5FF",
    text: "ART WIP\nSKETCH 2 + OVERVIEW",
    alt: "ART WIP - Uploaded Sketch 2 and Overview fixture",
  },
  {
    key: "art-complete-minimal",
    collection: "media",
    filename: "seed-art-complete-minimal.png",
    width: 1400,
    height: 1000,
    background: "#52525B",
    foreground: "#FAFAFA",
    text: "ART COMPLETE\nREQUIRED FIELDS ONLY",
    alt: "ART Complete - Required Fields Only fixture",
  },
  {
    key: "art-dual-mixed-character",
    collection: "media",
    filename: "seed-art-dual-mixed-character.png",
    width: 1400,
    height: 1000,
    background: "#1E40AF",
    foreground: "#EFF6FF",
    text: "ART COMPLETE\nDUAL MIXED PROFILE CH",
    alt: "ART Complete - Dual Mixed Profile Character fixture",
  },
  {
    key: "art-no-ref-character",
    collection: "media",
    filename: "seed-art-character-without-ref.png",
    width: 1400,
    height: 1000,
    background: "#475569",
    foreground: "#F8FAFC",
    text: "ART COMPLETE\nCHARACTER WITHOUT REF",
    alt: "ART Complete - Character Without Ref fixture",
  },
  {
    key: "art-nsfw-only",
    collection: "media",
    filename: "seed-art-nsfw-only.png",
    width: 1400,
    height: 1000,
    background: "#450A0A",
    foreground: "#FECACA",
    text: "ART COMPLETE\nNSFW-ONLY PROFILE",
    alt: "ART Complete - NSFW-Only Profile fixture",
  },
] as const;

function parseCli(): CliOptions {
  const args = process.argv.slice(2);
  const known = new Set(["--fresh", "--help", "-h"]);
  const unknown = args.filter((argument) => !known.has(argument));

  if (unknown.length > 0) {
    throw new Error(
      `Unknown seed option${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`,
    );
  }

  return {
    fresh: args.includes("--fresh"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function printHelp(): void {
  console.log(`Seed playwolf.net with deterministic development fixtures.

Usage:
  bun run seed
  bun run seed:fresh

Options:
  --fresh  Delete uploaded files, drop the Payload database schema, rebuild it,
           and then seed it. This is destructive.
  --help   Show this message.

Admin defaults:
  ${DEFAULT_ADMIN_EMAIL}
  ${DEFAULT_ADMIN_PASSWORD}

Environment overrides:
  SEED_ADMIN_EMAIL
  SEED_ADMIN_PASSWORD
  SEED_FRONTEND_URL             Defaults to http://localhost:3000
  SEED_ALLOW_PRODUCTION=true   Required for any production seed
  SEED_ALLOW_DESTRUCTIVE=true  Required for a production or remote fresh seed`);
}

function assertEnvironment({ fresh }: CliOptions): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env first.");
  }
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET is required. Copy .env.example to .env first.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "Refusing to seed with NODE_ENV=production. Set SEED_ALLOW_PRODUCTION=true to confirm.",
    );
  }

  if (
    isProduction &&
    (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)
  ) {
    throw new Error(
      "Production seeds require explicit SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD values.",
    );
  }

  if (!fresh) {
    if (process.env.PAYLOAD_DROP_DATABASE === "true") {
      throw new Error(
        "Refusing a non-destructive seed while PAYLOAD_DROP_DATABASE=true. Unset it or use seed:fresh.",
      );
    }
    return;
  }

  const database = new URL(process.env.DATABASE_URL);
  const storage = new URL(process.env.S3_ENDPOINT ?? "http://garage:3900");
  const localDatabaseHosts = new Set(["127.0.0.1", "::1", "[::1]", "db", "localhost"]);
  const localStorageHosts = new Set([
    "127.0.0.1",
    "::1",
    "[::1]",
    "garage",
    "localhost",
  ]);
  const destructiveTargets = [
    ...(isProduction ? ["production mode"] : []),
    ...(!localDatabaseHosts.has(database.hostname.toLowerCase())
      ? [`database ${database.hostname}`]
      : []),
    ...(!localStorageHosts.has(storage.hostname.toLowerCase())
      ? [`object storage ${storage.hostname}`]
      : []),
  ];

  if (destructiveTargets.length > 0 && process.env.SEED_ALLOW_DESTRUCTIVE !== "true") {
    throw new Error(
      `Refusing seed:fresh against ${destructiveTargets.join(" and ")}. Set SEED_ALLOW_DESTRUCTIVE=true to confirm.`,
    );
  }
}

function databaseLabel(): string {
  if (!process.env.DATABASE_URL) return "(missing DATABASE_URL)";
  const database = new URL(process.env.DATABASE_URL);
  return `${database.hostname}:${database.port || "5432"}${database.pathname}`;
}

async function clearCollection(
  payload: Payload,
  collection: CollectionSlug,
): Promise<number> {
  let deleted = 0;

  while (true) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
    });

    if (result.docs.length === 0) break;

    for (const document of result.docs) {
      await payload.delete({
        collection,
        id: document.id,
        context: seedContext(),
        depth: 0,
        overrideAccess: true,
        overrideLock: true,
        trash: true,
      });
      deleted += 1;
    }
  }

  return deleted;
}

async function clearDatabaseContent(payload: Payload): Promise<void> {
  console.log(`Clearing Payload content and uploaded files in ${databaseLabel()}...`);

  // Release the global's upload relationship before deleting Site images.
  await payload.updateGlobal({
    slug: "siteSettings",
    context: seedContext(),
    data: {
      about: null,
      heroTagline: null,
      heroTitle: null,
      links: [],
      maintenanceExcludedPaths: ["/ref"],
      maintenanceMessage: null,
      maintenanceMode: false,
      notifications: {
        channel: "ntfy",
        ntfy: { serverUrl: null, token: null, topic: null },
        smtp: {
          from: null,
          host: null,
          password: null,
          port: 587,
          secure: false,
          to: null,
          user: null,
        },
      },
      ogImage: null,
    },
    overrideAccess: true,
  });

  // Relationships and admin metadata are removed before the documents they
  // point at. Uploads go last so Payload and the S3 plugin can delete every
  // derivative; framed uploads also remove their pristine sidecar objects.
  const order: CollectionSlug[] = [
    "payload-locked-documents",
    "payload-preferences",
    "artworks",
    "projects",
    "characters",
    "friends",
    "tags",
    "artists",
    "media",
    "friend-images",
    "character-images",
    "project-images",
    "site-images",
    "users",
    "payload-kv",
  ];

  for (const collection of order) {
    const deleted = await clearCollection(payload, collection);
    if (deleted > 0) console.log(`  ${collection}: deleted ${deleted}`);
  }
}

async function initializePayload(fresh: boolean): Promise<Payload> {
  if (!fresh) return getPayload({ config, key: "seed" });

  // First remove documents through Payload so upload hooks can clean S3. The
  // second initialization uses Payload's own Postgres reset switch: in dev it
  // drops then pushes the current schema, while production rebuilds from the
  // configured prodMigrations.
  delete process.env.PAYLOAD_DROP_DATABASE;
  const cleanupPayload = await getPayload({ config, key: "seed-cleanup" });
  try {
    await clearDatabaseContent(cleanupPayload);
  } finally {
    await cleanupPayload.destroy();
  }

  process.env.PAYLOAD_DROP_DATABASE = "true";
  // Payload caches the last dev schema at module scope. This is the second
  // Payload instance in one process, so force Drizzle to rebuild after the
  // schema was dropped instead of treating the identical model as "unchanged".
  process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = "true";
  try {
    console.log(`Dropping and rebuilding Payload schema in ${databaseLabel()}...`);
    return await getPayload({ config, key: "seed-fresh" });
  } finally {
    delete process.env.PAYLOAD_DROP_DATABASE;
    delete process.env.PAYLOAD_FORCE_DRIZZLE_PUSH;
  }
}

async function upsertDocument<TSlug extends SeedCollectionSlug>(
  payload: Payload,
  stats: SeedStats,
  collection: TSlug,
  where: Where,
  data: RequiredDataFromCollectionSlug<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>> {
  const found = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where,
  });
  const existing = found.docs[0];

  if (existing) {
    const updated = await payload.update({
      collection,
      id: existing.id,
      context: seedContext(),
      // Payload's update overload cannot prove that its generic required-data
      // shape is also a valid deep partial, although every field is compatible.
      data: data as never,
      depth: 0,
      overrideAccess: true,
      overrideLock: true,
    });
    stats.updated += 1;
    return updated as unknown as DataFromCollectionSlug<TSlug>;
  }

  const created = await payload.create({
    collection,
    context: seedContext(),
    data,
    depth: 0,
    overrideAccess: true,
  });
  stats.created += 1;
  return created as DataFromCollectionSlug<TSlug>;
}

async function upsertSlugScenarios<TSlug extends SlugSeedCollectionSlug>(
  payload: Payload,
  stats: SeedStats,
  collection: TSlug,
  scenarios: readonly SlugScenario<TSlug>[],
): Promise<Map<string, DataFromCollectionSlug<TSlug>>> {
  const documents = new Map<string, DataFromCollectionSlug<TSlug>>();

  for (const scenario of scenarios) {
    documents.set(
      scenario.key,
      await upsertDocument(
        payload,
        stats,
        collection,
        { slug: { equals: scenario.data.slug } },
        scenario.data,
      ),
    );
  }

  return documents;
}

function scenarioDocument<T>(
  documents: ReadonlyMap<string, T>,
  key: string,
  collection: string,
): T {
  const document = documents.get(key);
  if (!document) throw new Error(`Seed ${collection} scenario ${key} was not created.`);
  return document;
}

function storedFilename(spec: PlaceholderSpec): string {
  if (spec.collection === "media") return spec.filename;
  return spec.filename.replace(/\.[^.]+$/, ".webp");
}

function uploadObjectKeys(document: SeededUploadDocument): string[] {
  const keys = new Set<string>();
  if (document.filename) keys.add(document.filename);

  for (const size of Object.values(document.sizes ?? {})) {
    if (size?.filename) keys.add(size.filename);
  }

  // Framed uploads also need their pristine sidecar for future re-crops.
  if (document.source?.key) keys.add(document.source.key);
  return [...keys];
}

function isMissingStorageObject(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
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

async function storageObjectExists(key: string): Promise<boolean> {
  try {
    await storageClient.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch (error) {
    if (isMissingStorageObject(error)) return false;
    throw error;
  }
}

async function storedUploadIsComplete(
  document: SeededUploadDocument,
): Promise<boolean> {
  const keys = uploadObjectKeys(document);
  if (keys.length === 0) return false;
  return (await Promise.all(keys.map(storageObjectExists))).every(Boolean);
}

function placeholderURL(spec: PlaceholderSpec): string {
  const background = spec.background.slice(1);
  const foreground = spec.foreground.slice(1);
  const search = new URLSearchParams({ font: "roboto", text: spec.text });
  return `https://placehold.co/${spec.width}x${spec.height}/${background}/${foreground}.png?${search}`;
}

function escapeXML(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function localPlaceholder(spec: PlaceholderSpec): Promise<Buffer> {
  const lines = spec.text.split("\n");
  const fontSize = Math.max(28, Math.round(Math.min(spec.width, spec.height) / 13));
  const lineHeight = Math.round(fontSize * 1.25);
  const firstY = spec.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const text = lines
    .map(
      (line, index) =>
        `<text x="50%" y="${firstY + index * lineHeight}" dominant-baseline="middle" text-anchor="middle">${escapeXML(line)}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <rect width="100%" height="100%" fill="${spec.background}"/>
  <g fill="${spec.foreground}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="2">${text}</g>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function downloadPlaceholder(spec: PlaceholderSpec): Promise<File> {
  const url = placeholderURL(spec);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(data).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("downloaded response was not a readable image");
      }

      const responseType = response.headers.get("content-type")?.split(";")[0];
      const mimetype =
        responseType?.startsWith("image/") === true
          ? responseType
          : `image/${metadata.format ?? "png"}`;
      return { data, mimetype, name: spec.filename, size: data.length };
    } catch (error) {
      if (attempt === 2) {
        console.warn(
          `  placehold.co unavailable for ${spec.key}; generating the same labelled placeholder locally.`,
          error,
        );
      }
    }
  }

  const data = await localPlaceholder(spec);
  return { data, mimetype: "image/png", name: spec.filename, size: data.length };
}

async function upsertUpload(
  payload: Payload,
  stats: SeedStats,
  spec: PlaceholderSpec,
): Promise<number> {
  const found = await payload.find({
    collection: spec.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      or: [
        { filename: { equals: storedFilename(spec) } },
        { alt: { equals: spec.alt } },
      ],
    },
  });
  const existing = found.docs[0];
  const data =
    spec.collection === "media"
      ? { alt: spec.alt, caption: spec.caption ?? null }
      : { alt: spec.alt };
  const storedFileIsComplete = existing
    ? await storedUploadIsComplete(existing as SeededUploadDocument)
    : false;
  const needsFile =
    !existing || !existing.url || !existing.filename || !storedFileIsComplete;
  const file = needsFile ? await downloadPlaceholder(spec) : undefined;

  if (file) stats.downloaded += 1;
  if (existing && file) {
    stats.repaired += 1;
    console.log(`  ${spec.key}: repairing missing storage objects`);
  }

  if (existing) {
    const updated = await payload.update({
      collection: spec.collection,
      id: existing.id,
      context: seedContext(),
      data,
      depth: 0,
      file,
      overrideAccess: true,
      overrideLock: true,
      overwriteExistingFiles: Boolean(file),
    });
    stats.updated += 1;
    return updated.id;
  }

  const created = await payload.create({
    collection: spec.collection,
    context: seedContext(),
    data,
    depth: 0,
    file,
    overrideAccess: true,
  });
  stats.created += 1;
  return created.id;
}

function richText(...paragraphs: string[]): NonNullable<SiteSetting["about"]> {
  return {
    root: {
      type: "root",
      children: paragraphs.map((text) => ({
        type: "paragraph",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

async function upsertArtwork(
  payload: Payload,
  stats: SeedStats,
  data: RequiredDataFromCollectionSlug<"artworks">,
): Promise<DataFromCollectionSlug<"artworks">> {
  const character =
    typeof data.character === "object" ? data.character.id : data.character;
  return upsertDocument(
    payload,
    stats,
    "artworks",
    {
      and: [
        { character: { equals: character } },
        { profile: { equals: data.profile } },
        { slug: { equals: data.slug } },
      ],
    },
    data,
  );
}

type ArtworkScenario = {
  data: RequiredDataFromCollectionSlug<"artworks">;
  key: string;
};

async function upsertArtworkScenarios(
  payload: Payload,
  stats: SeedStats,
  scenarios: readonly ArtworkScenario[],
): Promise<Map<string, DataFromCollectionSlug<"artworks">>> {
  const documents = new Map<string, DataFromCollectionSlug<"artworks">>();
  for (const scenario of scenarios) {
    documents.set(scenario.key, await upsertArtwork(payload, stats, scenario.data));
  }
  return documents;
}

async function seedDatabase(
  payload: Payload,
): Promise<{ adminEmail: string; stats: SeedStats }> {
  const stats: SeedStats = { created: 0, downloaded: 0, repaired: 0, updated: 0 };
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  console.log("Seeding admin and labelled placeholder images...");
  await upsertDocument(
    payload,
    stats,
    "users",
    { email: { equals: adminEmail } },
    {
      email: adminEmail,
      name: "Seed Administrator",
      password: adminPassword,
    },
  );

  const assets = new Map<string, number>();
  for (const spec of PLACEHOLDERS) {
    const id = await upsertUpload(payload, stats, spec);
    assets.set(spec.key, id);
  }
  const asset = (key: string): number => {
    const id = assets.get(key);
    if (id === undefined) throw new Error(`Seed image ${key} was not created.`);
    return id;
  };

  console.log("Seeding artists, friends, tags, and characters...");
  const artists = await upsertSlugScenarios(payload, stats, "artists", [
    {
      key: "full",
      data: {
        name: "AR Full - Multiple Links",
        slug: "ar-full-multiple-links",
        links: [
          { kind: "website", url: "https://example.com/ar-full" },
          { kind: "twitter", url: "https://x.com/arfullexample" },
          { kind: "bluesky", url: "https://bsky.app/profile/ar-full.example" },
          { kind: "instagram", url: "https://instagram.com/arfullexample" },
          { kind: "twitch", url: "https://twitch.tv/arfullexample" },
          { kind: "youtube", url: "https://youtube.com/@arfullexample" },
          {
            kind: "furaffinity",
            url: "https://www.furaffinity.net/user/arfullexample/",
          },
          { kind: "vgen", url: "https://vgen.co/arfullexample" },
          { kind: "linktree", url: "https://linktr.ee/arfullexample" },
          { kind: "kofi", url: "https://ko-fi.com/arfullexample" },
          { kind: "patreon", url: "https://patreon.com/arfullexample" },
          { kind: "boosty", url: "https://boosty.to/arfullexample" },
          { kind: "trello", url: "https://trello.com/b/example/ar-full" },
          {
            kind: "telegram",
            url: "https://t.me/arfullmain",
            description: "Main account",
          },
          {
            kind: "telegram",
            url: "https://t.me/arfullart",
            description: "Art channel",
          },
          { kind: "discord", url: "https://discord.gg/arfullexample" },
          { kind: "email", url: "ar-full@example.com" },
        ],
      },
    },
    {
      key: "partial",
      data: {
        name: "AR Partial - One Link",
        slug: "ar-partial-one-link",
        links: [{ kind: "vgen", url: "https://vgen.co/ar-partial" }],
      },
    },
    {
      key: "minimal",
      data: {
        name: "AR Minimal - No Links",
        slug: "ar-minimal-no-links",
        links: [],
      },
    },
  ]);
  const artistFull = scenarioDocument(artists, "full", "artist");
  const artistPartial = scenarioDocument(artists, "partial", "artist");
  const artistMinimal = scenarioDocument(artists, "minimal", "artist");

  const friends = await upsertSlugScenarios(payload, stats, "friends", [
    {
      key: "full",
      data: {
        name: "FR Full - Image, Description, Links",
        slug: "fr-full-image-description-links",
        image: asset("fr-full-image"),
        description: richText(
          "Fully populated friend fixture with image, rich-text description, and multiple links.",
        ),
        links: [
          { kind: "website", url: "https://example.com/fr-full" },
          { kind: "twitch", url: "https://twitch.tv/frfullexample" },
        ],
      },
    },
    {
      key: "image-only",
      data: {
        name: "FR Partial - Image Only",
        slug: "fr-partial-image-only",
        image: asset("fr-partial-image"),
        description: null,
        links: [],
      },
    },
    {
      key: "description-link",
      data: {
        name: "FR Partial - Description + One Link",
        slug: "fr-partial-description-one-link",
        image: null,
        description: richText(
          "Partially populated friend fixture with text and one link, but no image.",
        ),
        links: [{ kind: "youtube", url: "https://youtube.com/@frpartial" }],
      },
    },
    {
      key: "minimal",
      data: {
        name: "FR Minimal - Name Only",
        slug: "fr-minimal-name-only",
        image: null,
        description: null,
        links: [],
      },
    },
  ]);
  const friendFull = scenarioDocument(friends, "full", "friend");
  const friendImageOnly = scenarioDocument(friends, "image-only", "friend");
  const friendDescriptionLink = scenarioDocument(friends, "description-link", "friend");
  const friendMinimal = scenarioDocument(friends, "minimal", "friend");

  const tags = await upsertSlugScenarios(payload, stats, "tags", [
    { key: "portrait", data: { label: "TG - Portrait", slug: "tg-portrait" } },
    { key: "group", data: { label: "TG - Group", slug: "tg-group" } },
    {
      key: "commission",
      data: { label: "TG - Commission", slug: "tg-commission" },
    },
    {
      key: "alternate",
      data: { label: "TG - Alternate Version", slug: "tg-alternate-version" },
    },
    {
      key: "wip",
      data: { label: "TG - Work In Progress", slug: "tg-work-in-progress" },
    },
    { key: "night", data: { label: "TG - Night", slug: "tg-night" } },
  ]);
  const tag = (slug: string): number => {
    const document = tags.get(slug);
    if (!document) throw new Error(`Seed tag ${slug} was not created.`);
    return document.id;
  };

  const characters = await upsertSlugScenarios(payload, stats, "characters", [
    {
      key: "dual-full",
      data: {
        name: "CH Dual Profile - Full - Both Refs",
        slug: "ch-dual-profile-full-both-refs",
        species: "Species filled",
        order: 0,
        mainArt: {
          image: asset("ch-dual-full-portrait"),
          alt: "Explicit main art for the fully populated dual-profile fixture",
          artist: artistFull.id,
        },
        sfw: {
          enabled: true,
          label: "SFW - Full",
          accentColor: "#22D3EE",
          description: richText(
            "Fully populated SFW profile with explicit main art, description, image reference, artist, and artwork examples.",
          ),
          sheet: {
            kind: "image",
            title: "REF Image - Dual Profile Full - SFW",
            image: asset("ch-dual-full-sfw-ref"),
            description: "All reference-sheet metadata is populated.",
            artist: artistFull.id,
          },
        },
        nsfw: {
          enabled: true,
          label: "NSFW - Full",
          accentColor: "#F472B6",
          description: richText(
            "Fully populated NSFW profile with a distinct image reference and cross-rating artwork alternate.",
          ),
          sheet: {
            kind: "image",
            title: "REF Image - Dual Profile Full - NSFW",
            image: asset("ch-dual-full-nsfw-ref"),
            description: "All NSFW reference-sheet metadata is populated.",
            artist: artistPartial.id,
          },
        },
      },
    },
    {
      key: "dual-wip",
      data: {
        name: "CH Dual Profile - Full - WIP Refs",
        slug: "ch-dual-profile-full-wip-refs",
        species: "Species filled",
        order: 10,
        mainArt: {
          image: asset("ch-dual-wip-portrait"),
          alt: "Explicit main art for the dual WIP-reference fixture",
          artist: artistMinimal.id,
        },
        sfw: {
          enabled: true,
          label: "SFW - WIP Full",
          accentColor: "#A78BFA",
          description: richText(
            "Fully configured WIP reference with every visual option populated.",
          ),
          sheet: {
            kind: "wip",
            title: "REF WIP - Fully Configured - SFW",
            description:
              "Quotes, icons, colours, timing, progress, and artist are filled.",
            artist: artistMinimal.id,
            wip: {
              badge: "38% COMPLETE",
              aspect: "4/3",
              iconCount: 24,
              subtitle: "All WIP controls are populated.",
              quotes: [{ text: "Custom quote one." }, { text: "Custom quote two." }],
              icons: [{ name: "pencil" }, { name: "palette" }, { name: "sparkles" }],
              gradient: [{ color: "#7C3AED" }, { color: "#22D3EE" }],
              interval: 3600,
              progress: 38,
            },
          },
        },
        nsfw: {
          enabled: true,
          label: "NSFW - WIP Full",
          accentColor: "#FB7185",
          description: richText(
            "Second fully configured WIP reference for testing the profile switcher.",
          ),
          sheet: {
            kind: "wip",
            title: "REF WIP - Fully Configured - NSFW",
            description: "Uses different aspect, icons, gradient, and progress.",
            artist: artistPartial.id,
            wip: {
              badge: "EARLY CONCEPT",
              aspect: "16/9",
              iconCount: 12,
              subtitle: "Second full WIP configuration.",
              quotes: [{ text: "NSFW-specific custom quote." }],
              icons: [{ name: "moon" }, { name: "paintbrush" }],
              gradient: [{ color: "#BE123C" }, { color: "#7E22CE" }],
              interval: 5000,
              progress: 12,
            },
          },
        },
      },
    },
    {
      key: "single-nsfw-ref",
      data: {
        name: "CH Single NSFW Profile - With Ref",
        slug: "ch-single-nsfw-profile-with-ref",
        species: "Species filled",
        order: 20,
        mainArt: {
          image: asset("ch-single-nsfw-portrait"),
          alt: "Explicit main art for the NSFW-only fixture",
          artist: artistPartial.id,
        },
        sfw: {
          enabled: false,
          label: "SFW - Disabled",
          accentColor: "#64748B",
          description: null,
          sheet: { kind: "none" },
        },
        nsfw: {
          enabled: true,
          label: "NSFW - Only Profile",
          accentColor: "#EF4444",
          description: richText(
            "Only the NSFW profile is published, exercising default routing and consent.",
          ),
          sheet: {
            kind: "image",
            title: "REF Image - Single NSFW Profile",
            image: asset("ch-single-nsfw-ref"),
            description: "The only published reference on this character.",
            artist: artistPartial.id,
          },
        },
      },
    },
    {
      key: "single-sfw-ref",
      data: {
        name: "CH Single SFW Profile - With Ref",
        slug: "ch-single-sfw-profile-with-ref",
        species: "Species filled",
        order: 30,
        mainArt: {
          image: asset("ch-single-sfw-ref-portrait"),
          alt: "Explicit main art for the single SFW image-reference fixture",
          artist: artistFull.id,
        },
        sfw: {
          enabled: true,
          label: "SFW - Image Ref",
          accentColor: "#22C55E",
          description: richText(
            "Single SFW profile with all profile and image-reference fields populated.",
          ),
          sheet: {
            kind: "image",
            title: "REF Image - Single SFW Profile",
            image: asset("ch-single-sfw-ref"),
            description: "Fully populated single-profile reference.",
            artist: artistFull.id,
          },
        },
        nsfw: {
          enabled: false,
          label: "NSFW - Disabled",
          accentColor: "#64748B",
          description: null,
          sheet: { kind: "none" },
        },
      },
    },
    {
      key: "single-sfw-no-ref",
      data: {
        name: "CH Single SFW Profile - Without Ref",
        slug: "ch-single-sfw-profile-without-ref",
        species: "Species filled",
        order: 40,
        mainArt: { image: null, alt: null, artist: null },
        sfw: {
          enabled: true,
          label: "SFW - No Ref",
          accentColor: "#94A3B8",
          description: richText(
            "Profile description is filled, while main art and reference sheet are intentionally empty.",
          ),
          sheet: { kind: "none" },
        },
        nsfw: {
          enabled: false,
          label: "NSFW - Disabled",
          accentColor: "#64748B",
          description: null,
          sheet: { kind: "none" },
        },
      },
    },
    {
      key: "single-sfw-wip-partial",
      data: {
        name: "CH Single SFW Profile - Partial WIP Ref",
        slug: "ch-single-sfw-profile-partial-wip-ref",
        species: null,
        order: 50,
        mainArt: { image: null, alt: null, artist: null },
        sfw: {
          enabled: true,
          label: "SFW - Partial WIP",
          accentColor: "#F59E0B",
          description: null,
          sheet: {
            kind: "wip",
            title: "REF WIP - Partial Fields",
            description: null,
            artist: null,
            wip: {
              badge: "PARTIAL",
              progress: 15,
              // Everything else intentionally omitted to exercise WIP defaults.
            },
          },
        },
        nsfw: {
          enabled: false,
          label: "NSFW - Disabled",
          accentColor: "#64748B",
          description: null,
          sheet: { kind: "none" },
        },
      },
    },
    {
      key: "dual-mixed",
      data: {
        name: "CH Dual Profile - Partial - Mixed Refs",
        slug: "ch-dual-profile-partial-mixed-refs",
        species: null,
        order: 60,
        // No explicit main art: the SFW image reference must become the card fallback.
        mainArt: { image: null, alt: null, artist: null },
        sfw: {
          enabled: true,
          label: "SFW - Image Ref",
          accentColor: "#3B82F6",
          description: richText(
            "SFW is populated and supplies the fallback main image.",
          ),
          sheet: {
            kind: "image",
            title: "REF Image - Dual Mixed - SFW",
            image: asset("ch-dual-mixed-sfw-ref"),
            description: null,
            artist: null,
          },
        },
        nsfw: {
          enabled: true,
          label: "NSFW - No Ref",
          accentColor: "#A855F7",
          description: null,
          sheet: { kind: "none" },
        },
      },
    },
    {
      key: "dual-no-refs",
      data: {
        name: "CH Dual Profile - Partial - Without Refs",
        slug: "ch-dual-profile-partial-without-refs",
        species: null,
        order: 70,
        mainArt: { image: null, alt: null, artist: null },
        sfw: {
          enabled: true,
          label: "SFW - Description Only",
          accentColor: "#64748B",
          description: richText(
            "SFW has a description but no main art, sheet, or artwork examples.",
          ),
          sheet: { kind: "none" },
        },
        nsfw: {
          enabled: true,
          label: "NSFW - Empty",
          accentColor: "#78716C",
          description: null,
          sheet: { kind: "none" },
        },
      },
    },
    {
      key: "minimal",
      data: {
        name: "CH Minimal - Required Fields Only",
        slug: "ch-minimal-required-fields-only",
        order: 80,
        // All optional fields and profile groups are omitted so Payload defaults apply.
      },
    },
  ]);

  const chDualFull = scenarioDocument(characters, "dual-full", "character");
  const chDualWip = scenarioDocument(characters, "dual-wip", "character");
  const chSingleNsfwRef = scenarioDocument(characters, "single-nsfw-ref", "character");
  const chSingleSfwRef = scenarioDocument(characters, "single-sfw-ref", "character");
  const chSingleSfwNoRef = scenarioDocument(
    characters,
    "single-sfw-no-ref",
    "character",
  );
  const chSingleSfwWipPartial = scenarioDocument(
    characters,
    "single-sfw-wip-partial",
    "character",
  );
  const chDualMixed = scenarioDocument(characters, "dual-mixed", "character");

  console.log("Seeding complete, partial, empty, alternate, and WIP artworks...");
  const artworks = await upsertArtworkScenarios(payload, stats, [
    {
      key: "complete-full",
      data: {
        title: "ART Complete - Full Metadata + Alt Versions",
        slug: "art-complete-full-metadata-alt-versions",
        character: chDualFull.id,
        profile: "sfw",
        lifecycle: "complete",
        image: asset("art-full-primary"),
        altImages: [
          {
            image: asset("art-inline-alt"),
            label: "Inline alternate image with a caption",
          },
        ],
        altArtworks: [],
        artist: artistFull.id,
        featuring: [
          { relationTo: "friends", value: friendFull.id },
          { relationTo: "friends", value: friendImageOnly.id },
          { relationTo: "friends", value: friendDescriptionLink.id },
          { relationTo: "friends", value: friendMinimal.id },
          { relationTo: "characters", value: chDualWip.id },
          // The field hook removes the subject from this intentionally dirty input.
          { relationTo: "characters", value: chDualFull.id },
        ],
        tags: [tag("portrait"), tag("group"), tag("alternate")],
        order: 0,
        showWipHistory: false,
      },
    },
    {
      key: "same-rating-alt",
      data: {
        title: "ART Complete - Same-Rating Linked Alt",
        slug: "art-complete-same-rating-linked-alt",
        character: chDualFull.id,
        profile: "sfw",
        lifecycle: "complete",
        image: asset("art-same-rating-alt"),
        altArtworks: [],
        artist: artistMinimal.id,
        featuring: [{ relationTo: "friends", value: friendImageOnly.id }],
        tags: [tag("alternate"), tag("night")],
        order: 10,
      },
    },
    {
      key: "cross-rating-alt",
      data: {
        title: "ART Complete - Cross-Rating Linked Alt",
        slug: "art-complete-cross-rating-linked-alt",
        character: chDualFull.id,
        profile: "nsfw",
        lifecycle: "complete",
        image: asset("art-cross-rating-alt"),
        altArtworks: [],
        artist: artistPartial.id,
        featuring: [{ relationTo: "friends", value: friendFull.id }],
        tags: [tag("alternate")],
        order: 0,
      },
    },
    {
      key: "complete-history",
      data: {
        title: "ART Complete - WIP History Visible",
        slug: "art-complete-wip-history-visible",
        character: chDualFull.id,
        profile: "sfw",
        lifecycle: "complete",
        image: asset("art-history-final"),
        wipImages: [
          {
            image: asset("art-wip-sketch-1"),
            caption: "Initial composition sketch",
            addedAt: "2026-07-01T10:00:00.000Z",
          },
          {
            image: asset("art-wip-sketch-2"),
            caption: "Colour rough",
            addedAt: "2026-07-08T10:00:00.000Z",
          },
        ],
        showWipHistory: true,
        artist: artistMinimal.id,
        featuring: [{ relationTo: "friends", value: friendMinimal.id }],
        tags: [tag("commission"), tag("wip")],
        order: 20,
      },
    },
    {
      key: "wip-uploaded",
      data: {
        title: "ART WIP - Uploaded Sketch Overview + Full Commission",
        slug: "art-wip-uploaded-overview-full-commission",
        character: chDualWip.id,
        profile: "sfw",
        lifecycle: "in_progress",
        image: null,
        commission: {
          paid: true,
          artistStarted: true,
          lastArtistUpdateAt: "2026-07-20T12:00:00.000Z",
          lastArtistUpdateNote: "All private commission bookkeeping is populated.",
        },
        wipImages: [
          {
            image: asset("art-wip-sketch-1"),
            caption: "First uploaded WIP",
            addedAt: "2026-07-10T12:00:00.000Z",
          },
          {
            image: asset("art-wip-sketch-2"),
            caption: "Selected overview WIP",
            addedAt: "2026-07-20T12:00:00.000Z",
          },
        ],
        overviewDisplay: "wipImage",
        overviewWipImage: asset("art-wip-sketch-2"),
        wipPlaceholder: {
          badge: "FULL WIP",
          aspect: "4/3",
          iconCount: 18,
          subtitle: "Every artwork WIP option is populated.",
          quotes: [{ text: "Paid and underway." }, { text: "Reminder is due." }],
          icons: [{ name: "clock" }, { name: "paintbrush" }],
          gradient: [{ color: "#7C3AED" }, { color: "#0EA5E9" }],
          interval: 4000,
          progress: 62,
        },
        reminder: {
          enabled: true,
          interval: 1,
          unit: "weeks",
          nextAt: "2026-08-01T09:00:00.000Z",
          lastSentAt: null,
        },
        artist: artistMinimal.id,
        featuring: [{ relationTo: "friends", value: friendDescriptionLink.id }],
        tags: [tag("commission"), tag("wip")],
        order: 0,
      },
    },
    {
      key: "wip-generated",
      data: {
        title: "ART WIP - Generated Overview + Partial Commission",
        slug: "art-wip-generated-overview-partial-commission",
        character: chDualWip.id,
        profile: "nsfw",
        lifecycle: "in_progress",
        image: null,
        commission: {
          paid: false,
          artistStarted: false,
          lastArtistUpdateNote: "Only the note is filled; no update date.",
        },
        wipImages: [],
        overviewDisplay: "generated",
        wipPlaceholder: {
          badge: "QUEUED",
          aspect: "3/2",
          iconCount: 30,
          subtitle: "No sketches exist; the overview is generated.",
          quotes: [{ text: "Waiting for the first sketch." }],
          icons: [{ name: "hourglass" }, { name: "moon" }],
          gradient: [{ color: "#BE123C" }, { color: "#581C87" }],
          interval: 4500,
          progress: 5,
        },
        reminder: { enabled: false, interval: 2, unit: "weeks" },
        artist: artistPartial.id,
        tags: [tag("commission"), tag("wip")],
        order: 0,
      },
    },
    {
      key: "complete-minimal",
      data: {
        title: "ART Complete - Required Fields Only",
        slug: "art-complete-required-fields-only",
        character: chSingleSfwRef.id,
        profile: "sfw",
        image: asset("art-complete-minimal"),
      },
    },
    {
      key: "complete-no-ref",
      data: {
        title: "ART Complete - Character Without Ref",
        slug: "art-complete-character-without-ref",
        character: chSingleSfwNoRef.id,
        profile: "sfw",
        lifecycle: "complete",
        image: asset("art-no-ref-character"),
        artist: artistFull.id,
        featuring: [],
        tags: [tag("portrait")],
        order: 0,
      },
    },
    {
      key: "complete-nsfw-only",
      data: {
        title: "ART Complete - NSFW-Only Profile",
        slug: "art-complete-nsfw-only-profile",
        character: chSingleNsfwRef.id,
        profile: "nsfw",
        lifecycle: "complete",
        image: asset("art-nsfw-only"),
        artist: artistPartial.id,
        featuring: [{ relationTo: "friends", value: friendMinimal.id }],
        tags: [tag("portrait"), tag("night")],
        order: 0,
      },
    },
    {
      key: "wip-minimal",
      data: {
        title: "ART WIP - No Final, No Sketches, Defaults",
        slug: "art-wip-no-final-no-sketches-defaults",
        character: chSingleSfwWipPartial.id,
        profile: "sfw",
        lifecycle: "in_progress",
        image: null,
        wipImages: [],
        overviewDisplay: "generated",
        wipPlaceholder: { badge: "MINIMAL WIP" },
        order: 0,
      },
    },
    {
      key: "complete-dual-mixed",
      data: {
        title: "ART Complete - Dual Mixed Profile Character",
        slug: "art-complete-dual-mixed-profile-character",
        character: chDualMixed.id,
        profile: "sfw",
        lifecycle: "complete",
        image: asset("art-dual-mixed-character"),
        artist: null,
        featuring: [{ relationTo: "friends", value: friendDescriptionLink.id }],
        tags: [tag("group")],
        order: 0,
      },
    },
  ]);

  const artCompleteFull = scenarioDocument(artworks, "complete-full", "artwork");
  const artSameRatingAlt = scenarioDocument(artworks, "same-rating-alt", "artwork");
  const artCrossRatingAlt = scenarioDocument(artworks, "cross-rating-alt", "artwork");
  await payload.update({
    collection: "artworks",
    id: artCompleteFull.id,
    context: seedContext(),
    data: { altArtworks: [artSameRatingAlt.id, artCrossRatingAlt.id] },
    depth: 0,
    overrideAccess: true,
    overrideLock: true,
  });
  stats.updated += 1;

  console.log("Seeding every project status and site settings...");
  await upsertSlugScenarios(payload, stats, "projects", [
    {
      key: "live-full",
      data: {
        title: "PR Live - Full + Featured",
        slug: "pr-live-full-featured",
        summary: "Every project field is populated and the project is featured.",
        coverImage: asset("project-live"),
        body: richText(
          "Full project body with multiple paragraphs and links.",
          "Use this fixture for the live status, detail page, cover, and landing grid.",
        ),
        links: [
          { kind: "website", url: "https://example.com/pr-live-full" },
          {
            kind: "website",
            url: "https://github.com/example/pr-live-full",
            description: "Source repository",
          },
        ],
        status: "live",
        year: 2026,
        featured: true,
        order: 0,
      },
    },
    {
      key: "wip-partial",
      data: {
        title: "PR WIP - Partial + Featured",
        slug: "pr-wip-partial-featured",
        summary: "Cover, summary, and one link are filled; body and year are empty.",
        coverImage: asset("project-wip"),
        body: null,
        links: [{ kind: "trello", url: "https://trello.com/b/example/pr-wip-partial" }],
        status: "wip",
        year: null,
        featured: true,
        order: 10,
      },
    },
    {
      key: "planned-minimal",
      data: {
        title: "PR Planned - Minimal - No Cover",
        slug: "pr-planned-minimal-no-cover",
        summary: null,
        coverImage: null,
        body: null,
        links: [],
        status: "planned",
        year: null,
        featured: false,
        order: 20,
      },
    },
    {
      key: "archived-full",
      data: {
        title: "PR Archived - Full",
        slug: "pr-archived-full",
        summary: "A fully populated archived project.",
        coverImage: asset("project-archived"),
        body: richText(
          "Full archived project body for status-tab and detail-page coverage.",
        ),
        links: [{ kind: "website", url: "https://example.com/pr-archived-full" }],
        status: "archived",
        year: 2024,
        featured: false,
        order: 30,
      },
    },
  ]);

  await payload.updateGlobal({
    slug: "siteSettings",
    context: seedContext(),
    data: {
      maintenanceMode: false,
      maintenanceMessage:
        "Seeded maintenance message — toggle maintenance mode to test it.",
      maintenanceExcludedPaths: ["/ref"],
      heroTitle: "Seed Scenario Matrix",
      heroTagline:
        "A descriptive matrix of full, partial, empty, SFW, NSFW, image-ref, WIP-ref, and no-ref fixtures.",
      about: richText(
        "This content was created by bun run seed. Every fixture is named after the state it exercises instead of using an invented persona.",
        "Run bun run seed:fresh to remove every Payload document and upload before recreating these fixtures.",
      ),
      ogImage: asset("site-og"),
      links: [
        { kind: "website", url: "https://playwolf.net" },
        { kind: "bluesky", url: "https://bsky.app/profile/playwolf.example" },
        { kind: "twitch", url: "https://twitch.tv/playwolfexample" },
        { kind: "youtube", url: "https://youtube.com/@playwolfexample" },
        { kind: "email", url: "hello@playwolf.test" },
      ],
    },
    overrideAccess: true,
  });
  stats.updated += 1;

  return { adminEmail, stats };
}

async function revalidateFrontendCache(): Promise<void> {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) return;

  const origin =
    process.env.SEED_FRONTEND_URL ??
    `http://localhost:${process.env.PORT?.trim() || "3000"}`;
  const url = new URL(CACHE_REVALIDATION_PATH, origin);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${createCacheRevalidationToken(secret)}`,
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.warn(
        `  Frontend cache revalidation returned ${response.status} from ${url.origin}.`,
      );
      return;
    }

    console.log(`  Frontend cache invalidated at ${url.origin}.`);
  } catch {
    console.log(
      "  Frontend was not running; start or restart it to load the seeded data.",
    );
  }
}

async function main(): Promise<void> {
  const options = parseCli();
  if (options.help) {
    printHelp();
    return;
  }

  assertEnvironment(options);
  console.log(`${options.fresh ? "Fresh-seeding" : "Seeding"} ${databaseLabel()}`);

  let payload: Payload | undefined;
  try {
    payload = await initializePayload(options.fresh);
    const { adminEmail, stats } = await seedDatabase(payload);
    await revalidateFrontendCache();

    console.log("\nSeed complete.");
    console.log(
      `  Documents: ${stats.created} created, ${stats.updated} updated; ${stats.downloaded} placeholder images downloaded/generated (${stats.repaired} repaired)`,
    );
    console.log(`  Admin email: ${adminEmail}`);
    console.log(
      process.env.SEED_ADMIN_PASSWORD
        ? "  Admin password: value from SEED_ADMIN_PASSWORD"
        : `  Admin password: ${DEFAULT_ADMIN_PASSWORD}`,
    );
    console.log(
      "  Matrix: 9 characters, 11 artworks, 4 friends, 3 artists, 6 tags, 4 projects",
    );
    console.log("  Full dual-profile fixture: /ref/ch-dual-profile-full-both-refs");
    console.log("  Minimal fixture: /ref/ch-minimal-required-fields-only");
  } finally {
    await payload?.destroy();
    storageClient.destroy();
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error("\nSeed failed.");
  console.error(error);
  process.exit(1);
}

// This is a one-shot CLI: every write is complete and the database is closed.
process.exit(0);
