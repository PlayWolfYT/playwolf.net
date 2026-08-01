import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");

  -- Seed the product default so existing installs keep /ref reachable once
  -- maintenance is turned on. An empty hasMany reads as [] (not null), so the
  -- app cannot tell "never configured" from "admin cleared every path".
  INSERT INTO "site_settings_texts" ("order", "parent_id", "path", "text")
  SELECT 1, s."id", 'maintenanceExcludedPaths', '/ref'
  FROM "site_settings" s
  WHERE NOT EXISTS (
    SELECT 1 FROM "site_settings_texts" t
    WHERE t."parent_id" = s."id" AND t."path" = 'maintenanceExcludedPaths'
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_texts" CASCADE;`)
}
