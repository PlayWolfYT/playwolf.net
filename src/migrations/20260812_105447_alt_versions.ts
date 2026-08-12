import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Artwork alt versions: the `altImages` inline-variant array table and the
 * `altArtworks` self-relationship (a new `artworks_id` column on the existing
 * `artworks_rels` table; the `altOf` join field is virtual and needs no DDL).
 *
 * Hand-trimmed after `migrate:create`: the generator diffed against the
 * `20260811_201308_framed_upload_sizes` snapshot because
 * `20260812_005200_framed_crop_source` was authored by hand without one, so it
 * re-emitted that migration's source/crop columns. Those duplicates are
 * removed here; this file's own `.json` snapshot covers both changes, which
 * puts future diffs back on track.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "artworks_alt_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"label" varchar
  );
  
  ALTER TABLE "artworks_rels" ADD COLUMN "artworks_id" integer;
  ALTER TABLE "artworks_alt_images" ADD CONSTRAINT "artworks_alt_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks_alt_images" ADD CONSTRAINT "artworks_alt_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "artworks_alt_images_order_idx" ON "artworks_alt_images" USING btree ("_order");
  CREATE INDEX "artworks_alt_images_parent_id_idx" ON "artworks_alt_images" USING btree ("_parent_id");
  CREATE INDEX "artworks_alt_images_image_idx" ON "artworks_alt_images" USING btree ("image_id");
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "artworks_rels_artworks_id_idx" ON "artworks_rels" USING btree ("artworks_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artworks_alt_images" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "artworks_alt_images" CASCADE;
  ALTER TABLE "artworks_rels" DROP CONSTRAINT "artworks_rels_artworks_fk";
  
  DROP INDEX "artworks_rels_artworks_id_idx";
  ALTER TABLE "artworks_rels" DROP COLUMN "artworks_id";`);
}
