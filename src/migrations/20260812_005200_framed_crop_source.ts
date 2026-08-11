import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Persist the non-destructive crop sidecar pointer and the original-percent
 * crop rect on every framed upload collection. Existing rows get a full-frame
 * crop `(0, 0, 100, 100)`; `source_key` stays null so the next save that needs
 * a crop adopts the current main file as the original (pre-crop pixels for
 * already-destructively-cropped docs are unrecoverable).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "friend_images" ADD COLUMN "source_key" varchar;
  ALTER TABLE "friend_images" ADD COLUMN "source_width" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "source_height" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "source_mime_type" varchar;
  ALTER TABLE "friend_images" ADD COLUMN "crop_x" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "crop_y" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "crop_width" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "crop_height" numeric;
  ALTER TABLE "character_images" ADD COLUMN "source_key" varchar;
  ALTER TABLE "character_images" ADD COLUMN "source_width" numeric;
  ALTER TABLE "character_images" ADD COLUMN "source_height" numeric;
  ALTER TABLE "character_images" ADD COLUMN "source_mime_type" varchar;
  ALTER TABLE "character_images" ADD COLUMN "crop_x" numeric;
  ALTER TABLE "character_images" ADD COLUMN "crop_y" numeric;
  ALTER TABLE "character_images" ADD COLUMN "crop_width" numeric;
  ALTER TABLE "character_images" ADD COLUMN "crop_height" numeric;
  ALTER TABLE "project_images" ADD COLUMN "source_key" varchar;
  ALTER TABLE "project_images" ADD COLUMN "source_width" numeric;
  ALTER TABLE "project_images" ADD COLUMN "source_height" numeric;
  ALTER TABLE "project_images" ADD COLUMN "source_mime_type" varchar;
  ALTER TABLE "project_images" ADD COLUMN "crop_x" numeric;
  ALTER TABLE "project_images" ADD COLUMN "crop_y" numeric;
  ALTER TABLE "project_images" ADD COLUMN "crop_width" numeric;
  ALTER TABLE "project_images" ADD COLUMN "crop_height" numeric;
  ALTER TABLE "site_images" ADD COLUMN "source_key" varchar;
  ALTER TABLE "site_images" ADD COLUMN "source_width" numeric;
  ALTER TABLE "site_images" ADD COLUMN "source_height" numeric;
  ALTER TABLE "site_images" ADD COLUMN "source_mime_type" varchar;
  ALTER TABLE "site_images" ADD COLUMN "crop_x" numeric;
  ALTER TABLE "site_images" ADD COLUMN "crop_y" numeric;
  ALTER TABLE "site_images" ADD COLUMN "crop_width" numeric;
  ALTER TABLE "site_images" ADD COLUMN "crop_height" numeric;
  UPDATE "friend_images" SET "crop_x" = 0, "crop_y" = 0, "crop_width" = 100, "crop_height" = 100;
  UPDATE "character_images" SET "crop_x" = 0, "crop_y" = 0, "crop_width" = 100, "crop_height" = 100;
  UPDATE "project_images" SET "crop_x" = 0, "crop_y" = 0, "crop_width" = 100, "crop_height" = 100;
  UPDATE "site_images" SET "crop_x" = 0, "crop_y" = 0, "crop_width" = 100, "crop_height" = 100;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "friend_images" DROP COLUMN "source_key";
  ALTER TABLE "friend_images" DROP COLUMN "source_width";
  ALTER TABLE "friend_images" DROP COLUMN "source_height";
  ALTER TABLE "friend_images" DROP COLUMN "source_mime_type";
  ALTER TABLE "friend_images" DROP COLUMN "crop_x";
  ALTER TABLE "friend_images" DROP COLUMN "crop_y";
  ALTER TABLE "friend_images" DROP COLUMN "crop_width";
  ALTER TABLE "friend_images" DROP COLUMN "crop_height";
  ALTER TABLE "character_images" DROP COLUMN "source_key";
  ALTER TABLE "character_images" DROP COLUMN "source_width";
  ALTER TABLE "character_images" DROP COLUMN "source_height";
  ALTER TABLE "character_images" DROP COLUMN "source_mime_type";
  ALTER TABLE "character_images" DROP COLUMN "crop_x";
  ALTER TABLE "character_images" DROP COLUMN "crop_y";
  ALTER TABLE "character_images" DROP COLUMN "crop_width";
  ALTER TABLE "character_images" DROP COLUMN "crop_height";
  ALTER TABLE "project_images" DROP COLUMN "source_key";
  ALTER TABLE "project_images" DROP COLUMN "source_width";
  ALTER TABLE "project_images" DROP COLUMN "source_height";
  ALTER TABLE "project_images" DROP COLUMN "source_mime_type";
  ALTER TABLE "project_images" DROP COLUMN "crop_x";
  ALTER TABLE "project_images" DROP COLUMN "crop_y";
  ALTER TABLE "project_images" DROP COLUMN "crop_width";
  ALTER TABLE "project_images" DROP COLUMN "crop_height";
  ALTER TABLE "site_images" DROP COLUMN "source_key";
  ALTER TABLE "site_images" DROP COLUMN "source_width";
  ALTER TABLE "site_images" DROP COLUMN "source_height";
  ALTER TABLE "site_images" DROP COLUMN "source_mime_type";
  ALTER TABLE "site_images" DROP COLUMN "crop_x";
  ALTER TABLE "site_images" DROP COLUMN "crop_y";
  ALTER TABLE "site_images" DROP COLUMN "crop_width";
  ALTER TABLE "site_images" DROP COLUMN "crop_height";`);
}
