import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Twitch and YouTube as link kinds on artists, friends, projects, and site
 * settings. Both values are inserted AFTER the pre-existing `instagram` label
 * (youtube first, then twitch) so the enum order matches `LINK_KINDS` without
 * referencing a value added in this same transaction — PostgreSQL forbids that.
 *
 * Enum values cannot be dropped, so `down` is a no-op.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_artists_links_kind" ADD VALUE 'youtube' AFTER 'instagram';
  ALTER TYPE "public"."enum_artists_links_kind" ADD VALUE 'twitch' AFTER 'instagram';
  ALTER TYPE "public"."enum_friends_links_kind" ADD VALUE 'youtube' AFTER 'instagram';
  ALTER TYPE "public"."enum_friends_links_kind" ADD VALUE 'twitch' AFTER 'instagram';
  ALTER TYPE "public"."enum_projects_links_kind" ADD VALUE 'youtube' AFTER 'instagram';
  ALTER TYPE "public"."enum_projects_links_kind" ADD VALUE 'twitch' AFTER 'instagram';
  ALTER TYPE "public"."enum_site_settings_links_kind" ADD VALUE 'youtube' AFTER 'instagram';
  ALTER TYPE "public"."enum_site_settings_links_kind" ADD VALUE 'twitch' AFTER 'instagram';`);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot drop individual enum values.
}
