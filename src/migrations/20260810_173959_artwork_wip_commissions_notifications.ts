import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_artworks_lifecycle" AS ENUM('complete', 'in_progress');
  CREATE TYPE "public"."enum_artworks_overview_display" AS ENUM('generated', 'wipImage');
  CREATE TYPE "public"."enum_artworks_wip_placeholder_aspect" AS ENUM('4/3', '3/2', '16/9', '1/1');
  CREATE TYPE "public"."enum_artworks_reminder_unit" AS ENUM('days', 'weeks', 'months');
  CREATE TYPE "public"."enum_site_settings_notifications_channel" AS ENUM('ntfy', 'smtp', 'both');
  CREATE TABLE "artworks_wip_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"added_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "artworks_wip_placeholder_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "artworks_wip_placeholder_icons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "artworks_wip_placeholder_gradient" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  ALTER TABLE "artworks" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "artworks" ADD COLUMN "lifecycle" "enum_artworks_lifecycle" DEFAULT 'complete';
  ALTER TABLE "artworks" ADD COLUMN "commission_paid" boolean DEFAULT false;
  ALTER TABLE "artworks" ADD COLUMN "commission_artist_started" boolean DEFAULT false;
  ALTER TABLE "artworks" ADD COLUMN "commission_last_artist_update_at" timestamp(3) with time zone;
  ALTER TABLE "artworks" ADD COLUMN "commission_last_artist_update_note" varchar;
  ALTER TABLE "artworks" ADD COLUMN "overview_display" "enum_artworks_overview_display" DEFAULT 'generated';
  ALTER TABLE "artworks" ADD COLUMN "overview_wip_image_id" integer;
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_badge" varchar DEFAULT 'WIP';
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_aspect" "enum_artworks_wip_placeholder_aspect" DEFAULT '4/3';
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_icon_count" numeric DEFAULT 42;
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_subtitle" varchar DEFAULT 'Reference sheet in progress';
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_interval" numeric DEFAULT 5000;
  ALTER TABLE "artworks" ADD COLUMN "wip_placeholder_progress" numeric;
  ALTER TABLE "artworks" ADD COLUMN "show_wip_history" boolean DEFAULT false;
  ALTER TABLE "artworks" ADD COLUMN "reminder_enabled" boolean DEFAULT false;
  ALTER TABLE "artworks" ADD COLUMN "reminder_interval" numeric DEFAULT 1;
  ALTER TABLE "artworks" ADD COLUMN "reminder_unit" "enum_artworks_reminder_unit" DEFAULT 'weeks';
  ALTER TABLE "artworks" ADD COLUMN "reminder_next_at" timestamp(3) with time zone;
  ALTER TABLE "artworks" ADD COLUMN "reminder_last_sent_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_channel" "enum_site_settings_notifications_channel" DEFAULT 'ntfy';
  ALTER TABLE "site_settings" ADD COLUMN "notifications_ntfy_server_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_ntfy_topic" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_ntfy_token" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_host" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_port" numeric DEFAULT 587;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_secure" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_user" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_password" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_from" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_smtp_to" varchar;
  ALTER TABLE "artworks_wip_images" ADD CONSTRAINT "artworks_wip_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks_wip_images" ADD CONSTRAINT "artworks_wip_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_wip_placeholder_quotes" ADD CONSTRAINT "artworks_wip_placeholder_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_wip_placeholder_icons" ADD CONSTRAINT "artworks_wip_placeholder_icons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_wip_placeholder_gradient" ADD CONSTRAINT "artworks_wip_placeholder_gradient_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "artworks_wip_images_order_idx" ON "artworks_wip_images" USING btree ("_order");
  CREATE INDEX "artworks_wip_images_parent_id_idx" ON "artworks_wip_images" USING btree ("_parent_id");
  CREATE INDEX "artworks_wip_images_image_idx" ON "artworks_wip_images" USING btree ("image_id");
  CREATE INDEX "artworks_wip_placeholder_quotes_order_idx" ON "artworks_wip_placeholder_quotes" USING btree ("_order");
  CREATE INDEX "artworks_wip_placeholder_quotes_parent_id_idx" ON "artworks_wip_placeholder_quotes" USING btree ("_parent_id");
  CREATE INDEX "artworks_wip_placeholder_icons_order_idx" ON "artworks_wip_placeholder_icons" USING btree ("_order");
  CREATE INDEX "artworks_wip_placeholder_icons_parent_id_idx" ON "artworks_wip_placeholder_icons" USING btree ("_parent_id");
  CREATE INDEX "artworks_wip_placeholder_gradient_order_idx" ON "artworks_wip_placeholder_gradient" USING btree ("_order");
  CREATE INDEX "artworks_wip_placeholder_gradient_parent_id_idx" ON "artworks_wip_placeholder_gradient" USING btree ("_parent_id");
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_overview_wip_image_id_media_id_fk" FOREIGN KEY ("overview_wip_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "artworks_overview_wip_image_idx" ON "artworks" USING btree ("overview_wip_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artworks_wip_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "artworks_wip_placeholder_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "artworks_wip_placeholder_icons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "artworks_wip_placeholder_gradient" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "artworks_wip_images" CASCADE;
  DROP TABLE "artworks_wip_placeholder_quotes" CASCADE;
  DROP TABLE "artworks_wip_placeholder_icons" CASCADE;
  DROP TABLE "artworks_wip_placeholder_gradient" CASCADE;
  ALTER TABLE "artworks" DROP CONSTRAINT "artworks_overview_wip_image_id_media_id_fk";
  
  DROP INDEX "artworks_overview_wip_image_idx";
  ALTER TABLE "artworks" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "artworks" DROP COLUMN "lifecycle";
  ALTER TABLE "artworks" DROP COLUMN "commission_paid";
  ALTER TABLE "artworks" DROP COLUMN "commission_artist_started";
  ALTER TABLE "artworks" DROP COLUMN "commission_last_artist_update_at";
  ALTER TABLE "artworks" DROP COLUMN "commission_last_artist_update_note";
  ALTER TABLE "artworks" DROP COLUMN "overview_display";
  ALTER TABLE "artworks" DROP COLUMN "overview_wip_image_id";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_badge";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_aspect";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_icon_count";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_subtitle";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_interval";
  ALTER TABLE "artworks" DROP COLUMN "wip_placeholder_progress";
  ALTER TABLE "artworks" DROP COLUMN "show_wip_history";
  ALTER TABLE "artworks" DROP COLUMN "reminder_enabled";
  ALTER TABLE "artworks" DROP COLUMN "reminder_interval";
  ALTER TABLE "artworks" DROP COLUMN "reminder_unit";
  ALTER TABLE "artworks" DROP COLUMN "reminder_next_at";
  ALTER TABLE "artworks" DROP COLUMN "reminder_last_sent_at";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_channel";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_ntfy_server_url";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_ntfy_topic";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_ntfy_token";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_host";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_port";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_secure";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_user";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_password";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_from";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_smtp_to";
  DROP TYPE "public"."enum_artworks_lifecycle";
  DROP TYPE "public"."enum_artworks_overview_display";
  DROP TYPE "public"."enum_artworks_wip_placeholder_aspect";
  DROP TYPE "public"."enum_artworks_reminder_unit";
  DROP TYPE "public"."enum_site_settings_notifications_channel";`)
}
