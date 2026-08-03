import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- An artwork's own character is now always featured, derived from
  -- "artworks"."character_id" rather than listed a second time. Drop the
  -- redundant entries; artworks that never listed the subject need no change,
  -- they gain it on read.
  DELETE FROM "artworks_rels" AS r
  USING "artworks" AS a
  WHERE r."parent_id" = a."id"
    AND r."path" = 'featuring'
    AND r."characters_id" = a."character_id";

  -- Payload writes "order" as a 1-based position per path and re-numbers the
  -- whole path on the next save; closing the gaps now keeps the two agreeing.
  WITH ranked AS (
    SELECT
      "id",
      row_number() OVER (PARTITION BY "parent_id" ORDER BY "order", "id") AS position
    FROM "artworks_rels"
    WHERE "path" = 'featuring'
  )
  UPDATE "artworks_rels" AS r
  SET "order" = ranked."position"
  FROM ranked
  WHERE r."id" = ranked."id"
    AND r."order" IS DISTINCT FROM ranked."position";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Restore the old convention, where the subject had to be listed to appear.
  INSERT INTO "artworks_rels" ("order", "parent_id", "path", "characters_id")
  SELECT
    COALESCE(
      (
        SELECT MAX(r."order")
        FROM "artworks_rels" r
        WHERE r."parent_id" = a."id" AND r."path" = 'featuring'
      ),
      0
    ) + 1,
    a."id",
    'featuring',
    a."character_id"
  FROM "artworks" a
  WHERE NOT EXISTS (
    SELECT 1
    FROM "artworks_rels" r
    WHERE r."parent_id" = a."id"
      AND r."path" = 'featuring'
      AND r."characters_id" = a."character_id"
  );`)
}
