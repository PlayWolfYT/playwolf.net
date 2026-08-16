import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Indexes for the columns every hot query touches: the `profile` / `lifecycle`
 * filters on the public artwork pages, the `order` sort key on all three
 * listings, and `reminder_next_at`, the reminder cron's range predicate.
 * Postgres can sort a small table without them, but the plan degrades with row
 * count on exactly the collections that grow.
 *
 * The three `SET DEFAULT` statements are unrelated drift, swept up because this
 * is the first migration generated since `DEFAULT_WIP_SUBTITLE` changed in
 * `src/lib/sheet-wip.ts`. They are kept rather than hand-removed so the SQL
 * matches the schema snapshot beside it — dropping them would leave the snapshot
 * claiming a default that no migration ever applied, and the next generated
 * migration would emit them again. Column defaults are close to inert here in
 * any case: Payload sends every field default explicitly on create.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters" ALTER COLUMN "sfw_sheet_wip_subtitle" SET DEFAULT 'Artwork in progress, check back later~';
  ALTER TABLE "characters" ALTER COLUMN "nsfw_sheet_wip_subtitle" SET DEFAULT 'Artwork in progress, check back later~';
  ALTER TABLE "artworks" ALTER COLUMN "wip_placeholder_subtitle" SET DEFAULT 'Artwork in progress, check back later~';
  CREATE INDEX "characters_order_idx" ON "characters" USING btree ("order");
  CREATE INDEX "artworks_profile_idx" ON "artworks" USING btree ("profile");
  CREATE INDEX "artworks_lifecycle_idx" ON "artworks" USING btree ("lifecycle");
  CREATE INDEX "artworks_reminder_reminder_next_at_idx" ON "artworks" USING btree ("reminder_next_at");
  CREATE INDEX "artworks_order_idx" ON "artworks" USING btree ("order");
  CREATE INDEX "projects_order_idx" ON "projects" USING btree ("order");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "characters_order_idx";
  DROP INDEX "artworks_profile_idx";
  DROP INDEX "artworks_lifecycle_idx";
  DROP INDEX "artworks_reminder_reminder_next_at_idx";
  DROP INDEX "artworks_order_idx";
  DROP INDEX "projects_order_idx";
  ALTER TABLE "characters" ALTER COLUMN "sfw_sheet_wip_subtitle" SET DEFAULT 'Reference sheet in progress';
  ALTER TABLE "characters" ALTER COLUMN "nsfw_sheet_wip_subtitle" SET DEFAULT 'Reference sheet in progress';
  ALTER TABLE "artworks" ALTER COLUMN "wip_placeholder_subtitle" SET DEFAULT 'Reference sheet in progress';`);
}
