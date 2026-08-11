import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_url" varchar;
  ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_width" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_height" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_mime_type" varchar;
  ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_filesize" numeric;
  ALTER TABLE "friend_images" ADD COLUMN "sizes_frame_filename" varchar;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_url" varchar;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_width" numeric;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_height" numeric;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_mime_type" varchar;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_filesize" numeric;
  ALTER TABLE "character_images" ADD COLUMN "sizes_frame_filename" varchar;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_url" varchar;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_width" numeric;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_height" numeric;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_mime_type" varchar;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_filesize" numeric;
  ALTER TABLE "project_images" ADD COLUMN "sizes_frame_filename" varchar;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_url" varchar;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_width" numeric;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_height" numeric;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_mime_type" varchar;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_filesize" numeric;
  ALTER TABLE "site_images" ADD COLUMN "sizes_frame_filename" varchar;
  CREATE INDEX "friend_images_sizes_frame_sizes_frame_filename_idx" ON "friend_images" USING btree ("sizes_frame_filename");
  CREATE INDEX "character_images_sizes_frame_sizes_frame_filename_idx" ON "character_images" USING btree ("sizes_frame_filename");
  CREATE INDEX "project_images_sizes_frame_sizes_frame_filename_idx" ON "project_images" USING btree ("sizes_frame_filename");
  CREATE INDEX "site_images_sizes_frame_sizes_frame_filename_idx" ON "site_images" USING btree ("sizes_frame_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "friend_images_sizes_frame_sizes_frame_filename_idx";
  DROP INDEX "character_images_sizes_frame_sizes_frame_filename_idx";
  DROP INDEX "project_images_sizes_frame_sizes_frame_filename_idx";
  DROP INDEX "site_images_sizes_frame_sizes_frame_filename_idx";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_url";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_width";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_height";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_mime_type";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_filesize";
  ALTER TABLE "friend_images" DROP COLUMN "sizes_frame_filename";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_url";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_width";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_height";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_mime_type";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_filesize";
  ALTER TABLE "character_images" DROP COLUMN "sizes_frame_filename";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_url";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_width";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_height";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_mime_type";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_filesize";
  ALTER TABLE "project_images" DROP COLUMN "sizes_frame_filename";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_url";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_width";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_height";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_mime_type";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_filesize";
  ALTER TABLE "site_images" DROP COLUMN "sizes_frame_filename";`)
}
