import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * `maintenanceExcludedPaths` changed from a hasMany text field (rows in
 * `site_settings_texts`) to an array of `{ path, label }`. Production does not
 * push schema, so this table has to exist before the site-settings query runs.
 *
 * Existing path strings are copied across before the old table is dropped.
 * `/ref` picks up the new default label; every other path keeps a blank label
 * and the maintenance screen falls back to showing the path itself.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_maintenance_excluded_paths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar,
  	"label" varchar
  );

  INSERT INTO "site_settings_maintenance_excluded_paths" ("_order", "_parent_id", "id", "path", "label")
  SELECT
  	t."order",
  	t."parent_id",
  	md5('site_settings_texts:' || t."id"::text),
  	t."text",
  	CASE WHEN t."text" = '/ref' THEN 'Character References' ELSE NULL END
  FROM "site_settings_texts" t
  WHERE t."path" = 'maintenanceExcludedPaths'
  	AND t."text" IS NOT NULL
  	AND btrim(t."text") <> '';

  DROP TABLE "site_settings_texts" CASCADE;
  ALTER TABLE "site_settings_maintenance_excluded_paths" ADD CONSTRAINT "site_settings_maintenance_excluded_paths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_maintenance_excluded_paths_order_idx" ON "site_settings_maintenance_excluded_paths" USING btree ("_order");
  CREATE INDEX "site_settings_maintenance_excluded_paths_parent_id_idx" ON "site_settings_maintenance_excluded_paths" USING btree ("_parent_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

  INSERT INTO "site_settings_texts" ("order", "parent_id", "path", "text")
  SELECT
  	p."_order",
  	p."_parent_id",
  	'maintenanceExcludedPaths',
  	p."path"
  FROM "site_settings_maintenance_excluded_paths" p
  WHERE p."path" IS NOT NULL
  	AND btrim(p."path") <> '';

  DROP TABLE "site_settings_maintenance_excluded_paths" CASCADE;
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");`);
}
