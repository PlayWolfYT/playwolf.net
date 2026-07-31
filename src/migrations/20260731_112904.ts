import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_artists_links_kind" AS ENUM('website', 'twitter', 'bluesky', 'instagram', 'furaffinity', 'vgen', 'linktree', 'kofi', 'patreon', 'boosty', 'trello', 'telegram', 'discord', 'email');
  CREATE TYPE "public"."enum_friends_links_kind" AS ENUM('website', 'twitter', 'bluesky', 'instagram', 'furaffinity', 'vgen', 'linktree', 'kofi', 'patreon', 'boosty', 'trello', 'telegram', 'discord', 'email');
  CREATE TYPE "public"."enum_characters_sfw_sheet_kind" AS ENUM('none', 'image', 'wip');
  CREATE TYPE "public"."enum_characters_sfw_sheet_wip_aspect" AS ENUM('4/3', '3/2', '16/9', '1/1');
  CREATE TYPE "public"."enum_characters_nsfw_sheet_kind" AS ENUM('none', 'image', 'wip');
  CREATE TYPE "public"."enum_characters_nsfw_sheet_wip_aspect" AS ENUM('4/3', '3/2', '16/9', '1/1');
  CREATE TYPE "public"."enum_artworks_profile" AS ENUM('sfw', 'nsfw');
  CREATE TYPE "public"."enum_site_settings_links_kind" AS ENUM('website', 'twitter', 'bluesky', 'instagram', 'furaffinity', 'vgen', 'linktree', 'kofi', 'patreon', 'boosty', 'trello', 'telegram', 'discord', 'email');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
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
  
  CREATE TABLE "artists_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_artists_links_kind" DEFAULT 'website' NOT NULL,
  	"url" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "friends_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_friends_links_kind" DEFAULT 'website' NOT NULL,
  	"url" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "friends" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"image_id" integer,
  	"description" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "characters_sfw_sheet_wip_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "characters_sfw_sheet_wip_icons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "characters_sfw_sheet_wip_gradient" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  CREATE TABLE "characters_nsfw_sheet_wip_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "characters_nsfw_sheet_wip_icons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "characters_nsfw_sheet_wip_gradient" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  CREATE TABLE "characters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"species" varchar,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"main_art_image_id" integer,
  	"main_art_alt" varchar,
  	"main_art_artist_id" integer,
  	"sfw_enabled" boolean DEFAULT true,
  	"sfw_label" varchar DEFAULT 'SFW',
  	"sfw_accent_color" varchar DEFAULT '#3abef9',
  	"sfw_description" jsonb,
  	"sfw_sheet_kind" "enum_characters_sfw_sheet_kind" DEFAULT 'none',
  	"sfw_sheet_title" varchar,
  	"sfw_sheet_image_id" integer,
  	"sfw_sheet_description" varchar,
  	"sfw_sheet_artist_id" integer,
  	"sfw_sheet_wip_badge" varchar DEFAULT 'WIP',
  	"sfw_sheet_wip_aspect" "enum_characters_sfw_sheet_wip_aspect" DEFAULT '4/3',
  	"sfw_sheet_wip_icon_count" numeric DEFAULT 42,
  	"sfw_sheet_wip_subtitle" varchar DEFAULT 'Reference sheet in progress',
  	"sfw_sheet_wip_interval" numeric DEFAULT 5000,
  	"sfw_sheet_wip_progress" numeric,
  	"nsfw_enabled" boolean DEFAULT false,
  	"nsfw_label" varchar DEFAULT 'After Dark',
  	"nsfw_accent_color" varchar DEFAULT '#3abef9',
  	"nsfw_description" jsonb,
  	"nsfw_sheet_kind" "enum_characters_nsfw_sheet_kind" DEFAULT 'none',
  	"nsfw_sheet_title" varchar,
  	"nsfw_sheet_image_id" integer,
  	"nsfw_sheet_description" varchar,
  	"nsfw_sheet_artist_id" integer,
  	"nsfw_sheet_wip_badge" varchar DEFAULT 'WIP',
  	"nsfw_sheet_wip_aspect" "enum_characters_nsfw_sheet_wip_aspect" DEFAULT '4/3',
  	"nsfw_sheet_wip_icon_count" numeric DEFAULT 42,
  	"nsfw_sheet_wip_subtitle" varchar DEFAULT 'Reference sheet in progress',
  	"nsfw_sheet_wip_interval" numeric DEFAULT 5000,
  	"nsfw_sheet_wip_progress" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artworks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"character_id" integer NOT NULL,
  	"profile" "enum_artworks_profile" DEFAULT 'sfw' NOT NULL,
  	"image_id" integer NOT NULL,
  	"artist_id" integer,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artworks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"characters_id" integer,
  	"friends_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"artists_id" integer,
  	"friends_id" integer,
  	"tags_id" integer,
  	"characters_id" integer,
  	"artworks_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_site_settings_links_kind" DEFAULT 'website' NOT NULL,
  	"url" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"maintenance_mode" boolean DEFAULT false,
  	"maintenance_message" varchar,
  	"hero_title" varchar,
  	"hero_tagline" varchar,
  	"about" jsonb,
  	"og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artists_links" ADD CONSTRAINT "artists_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "friends_links" ADD CONSTRAINT "friends_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "friends" ADD CONSTRAINT "friends_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_sfw_sheet_wip_quotes" ADD CONSTRAINT "characters_sfw_sheet_wip_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_sfw_sheet_wip_icons" ADD CONSTRAINT "characters_sfw_sheet_wip_icons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_sfw_sheet_wip_gradient" ADD CONSTRAINT "characters_sfw_sheet_wip_gradient_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_nsfw_sheet_wip_quotes" ADD CONSTRAINT "characters_nsfw_sheet_wip_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_nsfw_sheet_wip_icons" ADD CONSTRAINT "characters_nsfw_sheet_wip_icons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_nsfw_sheet_wip_gradient" ADD CONSTRAINT "characters_nsfw_sheet_wip_gradient_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_main_art_image_id_media_id_fk" FOREIGN KEY ("main_art_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_main_art_artist_id_artists_id_fk" FOREIGN KEY ("main_art_artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_sfw_sheet_image_id_media_id_fk" FOREIGN KEY ("sfw_sheet_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_sfw_sheet_artist_id_artists_id_fk" FOREIGN KEY ("sfw_sheet_artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_nsfw_sheet_image_id_media_id_fk" FOREIGN KEY ("nsfw_sheet_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_nsfw_sheet_artist_id_artists_id_fk" FOREIGN KEY ("nsfw_sheet_artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_characters_fk" FOREIGN KEY ("characters_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_friends_fk" FOREIGN KEY ("friends_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_friends_fk" FOREIGN KEY ("friends_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_characters_fk" FOREIGN KEY ("characters_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_links" ADD CONSTRAINT "site_settings_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_display_sizes_display_filename_idx" ON "media" USING btree ("sizes_display_filename");
  CREATE INDEX "artists_links_order_idx" ON "artists_links" USING btree ("_order");
  CREATE INDEX "artists_links_parent_id_idx" ON "artists_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "artists_slug_idx" ON "artists" USING btree ("slug");
  CREATE INDEX "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE INDEX "friends_links_order_idx" ON "friends_links" USING btree ("_order");
  CREATE INDEX "friends_links_parent_id_idx" ON "friends_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "friends_slug_idx" ON "friends" USING btree ("slug");
  CREATE INDEX "friends_image_idx" ON "friends" USING btree ("image_id");
  CREATE INDEX "friends_updated_at_idx" ON "friends" USING btree ("updated_at");
  CREATE INDEX "friends_created_at_idx" ON "friends" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "characters_sfw_sheet_wip_quotes_order_idx" ON "characters_sfw_sheet_wip_quotes" USING btree ("_order");
  CREATE INDEX "characters_sfw_sheet_wip_quotes_parent_id_idx" ON "characters_sfw_sheet_wip_quotes" USING btree ("_parent_id");
  CREATE INDEX "characters_sfw_sheet_wip_icons_order_idx" ON "characters_sfw_sheet_wip_icons" USING btree ("_order");
  CREATE INDEX "characters_sfw_sheet_wip_icons_parent_id_idx" ON "characters_sfw_sheet_wip_icons" USING btree ("_parent_id");
  CREATE INDEX "characters_sfw_sheet_wip_gradient_order_idx" ON "characters_sfw_sheet_wip_gradient" USING btree ("_order");
  CREATE INDEX "characters_sfw_sheet_wip_gradient_parent_id_idx" ON "characters_sfw_sheet_wip_gradient" USING btree ("_parent_id");
  CREATE INDEX "characters_nsfw_sheet_wip_quotes_order_idx" ON "characters_nsfw_sheet_wip_quotes" USING btree ("_order");
  CREATE INDEX "characters_nsfw_sheet_wip_quotes_parent_id_idx" ON "characters_nsfw_sheet_wip_quotes" USING btree ("_parent_id");
  CREATE INDEX "characters_nsfw_sheet_wip_icons_order_idx" ON "characters_nsfw_sheet_wip_icons" USING btree ("_order");
  CREATE INDEX "characters_nsfw_sheet_wip_icons_parent_id_idx" ON "characters_nsfw_sheet_wip_icons" USING btree ("_parent_id");
  CREATE INDEX "characters_nsfw_sheet_wip_gradient_order_idx" ON "characters_nsfw_sheet_wip_gradient" USING btree ("_order");
  CREATE INDEX "characters_nsfw_sheet_wip_gradient_parent_id_idx" ON "characters_nsfw_sheet_wip_gradient" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "characters_slug_idx" ON "characters" USING btree ("slug");
  CREATE INDEX "characters_main_art_main_art_image_idx" ON "characters" USING btree ("main_art_image_id");
  CREATE INDEX "characters_main_art_main_art_artist_idx" ON "characters" USING btree ("main_art_artist_id");
  CREATE INDEX "characters_sfw_sheet_sfw_sheet_image_idx" ON "characters" USING btree ("sfw_sheet_image_id");
  CREATE INDEX "characters_sfw_sheet_sfw_sheet_artist_idx" ON "characters" USING btree ("sfw_sheet_artist_id");
  CREATE INDEX "characters_nsfw_sheet_nsfw_sheet_image_idx" ON "characters" USING btree ("nsfw_sheet_image_id");
  CREATE INDEX "characters_nsfw_sheet_nsfw_sheet_artist_idx" ON "characters" USING btree ("nsfw_sheet_artist_id");
  CREATE INDEX "characters_updated_at_idx" ON "characters" USING btree ("updated_at");
  CREATE INDEX "characters_created_at_idx" ON "characters" USING btree ("created_at");
  CREATE INDEX "artworks_slug_idx" ON "artworks" USING btree ("slug");
  CREATE INDEX "artworks_character_idx" ON "artworks" USING btree ("character_id");
  CREATE INDEX "artworks_image_idx" ON "artworks" USING btree ("image_id");
  CREATE INDEX "artworks_artist_idx" ON "artworks" USING btree ("artist_id");
  CREATE INDEX "artworks_updated_at_idx" ON "artworks" USING btree ("updated_at");
  CREATE INDEX "artworks_created_at_idx" ON "artworks" USING btree ("created_at");
  CREATE INDEX "artworks_rels_order_idx" ON "artworks_rels" USING btree ("order");
  CREATE INDEX "artworks_rels_parent_idx" ON "artworks_rels" USING btree ("parent_id");
  CREATE INDEX "artworks_rels_path_idx" ON "artworks_rels" USING btree ("path");
  CREATE INDEX "artworks_rels_characters_id_idx" ON "artworks_rels" USING btree ("characters_id");
  CREATE INDEX "artworks_rels_friends_id_idx" ON "artworks_rels" USING btree ("friends_id");
  CREATE INDEX "artworks_rels_tags_id_idx" ON "artworks_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX "payload_locked_documents_rels_friends_id_idx" ON "payload_locked_documents_rels" USING btree ("friends_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_characters_id_idx" ON "payload_locked_documents_rels" USING btree ("characters_id");
  CREATE INDEX "payload_locked_documents_rels_artworks_id_idx" ON "payload_locked_documents_rels" USING btree ("artworks_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_links_order_idx" ON "site_settings_links" USING btree ("_order");
  CREATE INDEX "site_settings_links_parent_id_idx" ON "site_settings_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "artists_links" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "friends_links" CASCADE;
  DROP TABLE "friends" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "characters_sfw_sheet_wip_quotes" CASCADE;
  DROP TABLE "characters_sfw_sheet_wip_icons" CASCADE;
  DROP TABLE "characters_sfw_sheet_wip_gradient" CASCADE;
  DROP TABLE "characters_nsfw_sheet_wip_quotes" CASCADE;
  DROP TABLE "characters_nsfw_sheet_wip_icons" CASCADE;
  DROP TABLE "characters_nsfw_sheet_wip_gradient" CASCADE;
  DROP TABLE "characters" CASCADE;
  DROP TABLE "artworks" CASCADE;
  DROP TABLE "artworks_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_artists_links_kind";
  DROP TYPE "public"."enum_friends_links_kind";
  DROP TYPE "public"."enum_characters_sfw_sheet_kind";
  DROP TYPE "public"."enum_characters_sfw_sheet_wip_aspect";
  DROP TYPE "public"."enum_characters_nsfw_sheet_kind";
  DROP TYPE "public"."enum_characters_nsfw_sheet_wip_aspect";
  DROP TYPE "public"."enum_artworks_profile";
  DROP TYPE "public"."enum_site_settings_links_kind";`)
}
