import { CopyObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

type Db = MigrateUpArgs["db"];

type MediaRow = {
  id: number;
  alt: string | null;
  blur_data_u_r_l: string | null;
  updated_at: string;
  created_at: string;
  url: string | null;
  thumbnail_u_r_l: string | null;
  filename: string | null;
  mime_type: string | null;
  filesize: string | null;
  width: string | null;
  height: string | null;
  focal_x: string | null;
  focal_y: string | null;
  sizes_thumbnail_url: string | null;
  sizes_thumbnail_width: string | null;
  sizes_thumbnail_height: string | null;
  sizes_thumbnail_mime_type: string | null;
  sizes_thumbnail_filesize: string | null;
  sizes_thumbnail_filename: string | null;
  sizes_card_url: string | null;
  sizes_card_width: string | null;
  sizes_card_height: string | null;
  sizes_card_mime_type: string | null;
  sizes_card_filesize: string | null;
  sizes_card_filename: string | null;
  sizes_display_url: string | null;
  sizes_display_width: string | null;
  sizes_display_height: string | null;
  sizes_display_mime_type: string | null;
  sizes_display_filesize: string | null;
  sizes_display_filename: string | null;
};

const UPLOAD_COLUMNS = `
  alt, blur_data_u_r_l, updated_at, created_at, url, thumbnail_u_r_l, filename,
  mime_type, filesize, width, height, focal_x, focal_y,
  sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height,
  sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename,
  sizes_card_url, sizes_card_width, sizes_card_height, sizes_card_mime_type,
  sizes_card_filesize, sizes_card_filename,
  sizes_display_url, sizes_display_width, sizes_display_height,
  sizes_display_mime_type, sizes_display_filesize, sizes_display_filename
` as const;

function rewriteMediaUrl(url: string | null, collectionSlug: string): string | null {
  if (!url) return url;
  return url.replaceAll("/api/media/file/", `/api/${collectionSlug}/file/`);
}

function s3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    forcePathStyle: true,
    region: process.env.S3_REGION ?? "garage",
  });
}

async function copyS3Object(
  client: S3Client,
  bucket: string,
  fromKey: string,
  toKey: string,
): Promise<void> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: fromKey }));
  } catch {
    return;
  }

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fromKey}`,
      Key: toKey,
    }),
  );
}

async function copyMediaFilesToCollection(
  media: MediaRow,
  collectionSlug: string,
): Promise<void> {
  const client = s3Client();
  const bucket = process.env.S3_BUCKET ?? "playwolf-media";
  if (!client) return;

  const filenames = [
    media.filename,
    media.sizes_thumbnail_filename,
    media.sizes_card_filename,
    media.sizes_display_filename,
  ].filter((name): name is string => Boolean(name));

  for (const filename of new Set(filenames)) {
    await copyS3Object(
      client,
      bucket,
      `media/${filename}`,
      `${collectionSlug}/${filename}`,
    );
  }
}

/**
 * Copy each distinct media row referenced by `sourceColumn` into `targetTable`,
 * rewrite API URLs to the new collection, copy S3 objects into the new prefix,
 * and remap the FK column onto the new ids. Rows whose media is missing are
 * cleared so the new foreign key can be applied cleanly.
 */
async function remappingUploadRelation({
  db,
  sourceTable,
  sourceColumn,
  targetTable,
  collectionSlug,
}: {
  db: Db;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  collectionSlug: string;
}): Promise<void> {
  const referenced = await db.execute(sql.raw(`
    SELECT DISTINCT ${sourceColumn} AS media_id
    FROM ${sourceTable}
    WHERE ${sourceColumn} IS NOT NULL
  `));

  const mediaIds = (referenced.rows as { media_id: number }[])
    .map((row) => row.media_id)
    .filter((id) => typeof id === "number");

  if (mediaIds.length === 0) return;

  const mediaResult = await db.execute(sql.raw(`
    SELECT id, ${UPLOAD_COLUMNS}
    FROM media
    WHERE id IN (${mediaIds.join(",")})
  `));
  const mediaRows = mediaResult.rows as MediaRow[];
  const foundIds = new Set(mediaRows.map((row) => row.id));

  // Drop references to media that no longer exist before the new FK lands.
  const missing = mediaIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    await db.execute(sql.raw(`
      UPDATE ${sourceTable}
      SET ${sourceColumn} = NULL
      WHERE ${sourceColumn} IN (${missing.join(",")})
    `));
  }

  const idMap = new Map<number, number>();

  for (const media of mediaRows) {
    await copyMediaFilesToCollection(media, collectionSlug);

    const inserted = await db.execute(sql`
      INSERT INTO ${sql.raw(targetTable)} (
        alt, blur_data_u_r_l, updated_at, created_at, url, thumbnail_u_r_l, filename,
        mime_type, filesize, width, height, focal_x, focal_y,
        sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height,
        sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename,
        sizes_card_url, sizes_card_width, sizes_card_height, sizes_card_mime_type,
        sizes_card_filesize, sizes_card_filename,
        sizes_display_url, sizes_display_width, sizes_display_height,
        sizes_display_mime_type, sizes_display_filesize, sizes_display_filename
      ) VALUES (
        ${media.alt},
        ${media.blur_data_u_r_l},
        ${media.updated_at},
        ${media.created_at},
        ${rewriteMediaUrl(media.url, collectionSlug)},
        ${rewriteMediaUrl(media.thumbnail_u_r_l, collectionSlug)},
        ${media.filename},
        ${media.mime_type},
        ${media.filesize},
        ${media.width},
        ${media.height},
        ${media.focal_x},
        ${media.focal_y},
        ${rewriteMediaUrl(media.sizes_thumbnail_url, collectionSlug)},
        ${media.sizes_thumbnail_width},
        ${media.sizes_thumbnail_height},
        ${media.sizes_thumbnail_mime_type},
        ${media.sizes_thumbnail_filesize},
        ${media.sizes_thumbnail_filename},
        ${rewriteMediaUrl(media.sizes_card_url, collectionSlug)},
        ${media.sizes_card_width},
        ${media.sizes_card_height},
        ${media.sizes_card_mime_type},
        ${media.sizes_card_filesize},
        ${media.sizes_card_filename},
        ${rewriteMediaUrl(media.sizes_display_url, collectionSlug)},
        ${media.sizes_display_width},
        ${media.sizes_display_height},
        ${media.sizes_display_mime_type},
        ${media.sizes_display_filesize},
        ${media.sizes_display_filename}
      )
      RETURNING id
    `);

    const newId = (inserted.rows[0] as { id: number } | undefined)?.id;
    if (newId !== undefined) idMap.set(media.id, newId);
  }

  for (const [oldId, newId] of idMap) {
    await db.execute(sql.raw(`
      UPDATE ${sourceTable}
      SET ${sourceColumn} = ${newId}
      WHERE ${sourceColumn} = ${oldId}
    `));
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "friend_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_display_url" varchar,
  	"sizes_display_width" numeric,
  	"sizes_display_height" numeric,
  	"sizes_display_mime_type" varchar,
  	"sizes_display_filesize" numeric,
  	"sizes_display_filename" varchar
  );
  
  CREATE TABLE "character_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_display_url" varchar,
  	"sizes_display_width" numeric,
  	"sizes_display_height" numeric,
  	"sizes_display_mime_type" varchar,
  	"sizes_display_filesize" numeric,
  	"sizes_display_filename" varchar
  );
  
  CREATE TABLE "project_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_display_url" varchar,
  	"sizes_display_width" numeric,
  	"sizes_display_height" numeric,
  	"sizes_display_mime_type" varchar,
  	"sizes_display_filesize" numeric,
  	"sizes_display_filename" varchar
  );
  
  CREATE TABLE "site_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_display_url" varchar,
  	"sizes_display_width" numeric,
  	"sizes_display_height" numeric,
  	"sizes_display_mime_type" varchar,
  	"sizes_display_filesize" numeric,
  	"sizes_display_filename" varchar
  );
  
  ALTER TABLE "friends" DROP CONSTRAINT "friends_image_id_media_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_main_art_image_id_media_id_fk";
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_cover_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_og_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "friend_images_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "character_images_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_images_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_images_id" integer;
  CREATE INDEX "friend_images_updated_at_idx" ON "friend_images" USING btree ("updated_at");
  CREATE INDEX "friend_images_created_at_idx" ON "friend_images" USING btree ("created_at");
  CREATE UNIQUE INDEX "friend_images_filename_idx" ON "friend_images" USING btree ("filename");
  CREATE INDEX "friend_images_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "friend_images" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "friend_images_sizes_card_sizes_card_filename_idx" ON "friend_images" USING btree ("sizes_card_filename");
  CREATE INDEX "friend_images_sizes_display_sizes_display_filename_idx" ON "friend_images" USING btree ("sizes_display_filename");
  CREATE INDEX "character_images_updated_at_idx" ON "character_images" USING btree ("updated_at");
  CREATE INDEX "character_images_created_at_idx" ON "character_images" USING btree ("created_at");
  CREATE UNIQUE INDEX "character_images_filename_idx" ON "character_images" USING btree ("filename");
  CREATE INDEX "character_images_sizes_thumbnail_sizes_thumbnail_filenam_idx" ON "character_images" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "character_images_sizes_card_sizes_card_filename_idx" ON "character_images" USING btree ("sizes_card_filename");
  CREATE INDEX "character_images_sizes_display_sizes_display_filename_idx" ON "character_images" USING btree ("sizes_display_filename");
  CREATE INDEX "project_images_updated_at_idx" ON "project_images" USING btree ("updated_at");
  CREATE INDEX "project_images_created_at_idx" ON "project_images" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_images_filename_idx" ON "project_images" USING btree ("filename");
  CREATE INDEX "project_images_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "project_images" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "project_images_sizes_card_sizes_card_filename_idx" ON "project_images" USING btree ("sizes_card_filename");
  CREATE INDEX "project_images_sizes_display_sizes_display_filename_idx" ON "project_images" USING btree ("sizes_display_filename");
  CREATE INDEX "site_images_updated_at_idx" ON "site_images" USING btree ("updated_at");
  CREATE INDEX "site_images_created_at_idx" ON "site_images" USING btree ("created_at");
  CREATE UNIQUE INDEX "site_images_filename_idx" ON "site_images" USING btree ("filename");
  CREATE INDEX "site_images_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "site_images" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "site_images_sizes_card_sizes_card_filename_idx" ON "site_images" USING btree ("sizes_card_filename");
  CREATE INDEX "site_images_sizes_display_sizes_display_filename_idx" ON "site_images" USING btree ("sizes_display_filename");
  `);

  // Existing portrait/cover/OG uploads lived on `media`. Copy them into the
  // dedicated libraries (and their S3 prefixes) before the new FKs are applied.
  await remappingUploadRelation({
    db,
    sourceTable: "friends",
    sourceColumn: "image_id",
    targetTable: "friend_images",
    collectionSlug: "friend-images",
  });
  await remappingUploadRelation({
    db,
    sourceTable: "characters",
    sourceColumn: "main_art_image_id",
    targetTable: "character_images",
    collectionSlug: "character-images",
  });
  await remappingUploadRelation({
    db,
    sourceTable: "projects",
    sourceColumn: "cover_image_id",
    targetTable: "project_images",
    collectionSlug: "project-images",
  });
  await remappingUploadRelation({
    db,
    sourceTable: "site_settings",
    sourceColumn: "og_image_id",
    targetTable: "site_images",
    collectionSlug: "site-images",
  });

  await db.execute(sql`
  ALTER TABLE "friends" ADD CONSTRAINT "friends_image_id_friend_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."friend_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_main_art_image_id_character_images_id_fk" FOREIGN KEY ("main_art_image_id") REFERENCES "public"."character_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_id_project_images_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."project_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_friend_images_fk" FOREIGN KEY ("friend_images_id") REFERENCES "public"."friend_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_character_images_fk" FOREIGN KEY ("character_images_id") REFERENCES "public"."character_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_images_fk" FOREIGN KEY ("project_images_id") REFERENCES "public"."project_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_images_fk" FOREIGN KEY ("site_images_id") REFERENCES "public"."site_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_site_images_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."site_images"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_friend_images_id_idx" ON "payload_locked_documents_rels" USING btree ("friend_images_id");
  CREATE INDEX "payload_locked_documents_rels_character_images_id_idx" ON "payload_locked_documents_rels" USING btree ("character_images_id");
  CREATE INDEX "payload_locked_documents_rels_project_images_id_idx" ON "payload_locked_documents_rels" USING btree ("project_images_id");
  CREATE INDEX "payload_locked_documents_rels_site_images_id_idx" ON "payload_locked_documents_rels" USING btree ("site_images_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remapped ids point at the cropped libraries, not media — clear them before
  // restoring the old media foreign keys.
  await db.execute(sql`
  UPDATE "friends" SET "image_id" = NULL;
  UPDATE "characters" SET "main_art_image_id" = NULL;
  UPDATE "projects" SET "cover_image_id" = NULL;
  UPDATE "site_settings" SET "og_image_id" = NULL;

  ALTER TABLE "friends" DROP CONSTRAINT "friends_image_id_friend_images_id_fk";
  ALTER TABLE "characters" DROP CONSTRAINT "characters_main_art_image_id_character_images_id_fk";
  ALTER TABLE "projects" DROP CONSTRAINT "projects_cover_image_id_project_images_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_friend_images_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_character_images_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_images_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_images_fk";
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_og_image_id_site_images_id_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_friend_images_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_character_images_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_project_images_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_site_images_id_idx";

  ALTER TABLE "friends" ADD CONSTRAINT "friends_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_main_art_image_id_media_id_fk" FOREIGN KEY ("main_art_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "friend_images_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "character_images_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_images_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_images_id";

  DROP TABLE "friend_images" CASCADE;
  DROP TABLE "character_images" CASCADE;
  DROP TABLE "project_images" CASCADE;
  DROP TABLE "site_images" CASCADE;`);
}
