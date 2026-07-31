#!/bin/sh
# Umami keeps its own schema, so it gets its own database rather than sharing
# Payload's. One Postgres instance is plenty for both at this scale.
#
# Postgres only runs this on a *fresh* data directory. On an existing volume,
# create the database by hand instead:
#
#   docker compose exec db createdb -U "$POSTGRES_USER" umami
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
	CREATE DATABASE ${UMAMI_DB:-umami} OWNER ${POSTGRES_USER};
SQL
