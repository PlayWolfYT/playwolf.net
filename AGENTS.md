# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 + Payload CMS 3.86 app (`playwolf.net`). Bun is the package
manager/build tool (`node` is only the production runtime). Standard commands live in
[`package.json`](package.json) `scripts` and the [`README.md`](README.md); the
production/prod-style stack is described in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
The notes below are the non-obvious bits for developing in the Cursor Cloud VM.

### Services

On a Docker-capable machine (local Windows/macOS/Linux with Docker Desktop), prefer:

```bash
bun run dev:up   # Postgres + Garage via compose, then scripts/garage-bootstrap.ts
bun run dev      # Next.js + Payload
```

That layers [`docker-compose.dev.yml`](docker-compose.dev.yml) to publish `db:5432`
and `garage:3900`/`3903` on loopback, and imports the pinned local S3 credentials
from `.env`. Do **not** use `docker-compose.dev.yml` on Coolify.

#### Cursor Cloud VM (no Docker)

The Cloud VM does not have Docker. Three long-running processes are involved:

| Service                           | Purpose                                            | How it runs in this VM                                      | Port                                  |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Next.js + Payload (`bun run dev`) | The app, custom admin (`/admin`), REST/GraphQL API | started manually                                            | `3000`                                |
| PostgreSQL 16                     | All Payload collections + `siteSettings`           | apt-installed cluster, **not** started by the update script | `5432`                                |
| Garage (S3)                       | Object storage for media uploads                   | static binary at `/tmp/garage`, config in `~/.garage`       | `3900` (S3), `3901` RPC, `3903` admin |

Postgres and Garage are only needed at runtime. The environment's `start` script now
brings both up on every boot (idempotently) and syncs the local Garage S3 key into `.env`,
so a fresh Cloud Agent already has them running — only `bun run dev` is started by hand. If
you ever need to (re)start them manually (e.g. after stopping one), the commands are:

```bash
# PostgreSQL (no systemd in this container, so use pg_ctlcluster)
sudo pg_ctlcluster 16 main start        # DB + role/db "playwolf" already exist on the snapshot

# Garage S3 (only needed for media upload/serving)
/tmp/garage -c ~/.garage/garage.toml server &   # layout, bucket "playwolf-media" and key already bootstrapped
```

Verify Postgres with `pg_lsclusters` and Garage with `/tmp/garage -c ~/.garage/garage.toml status`.

### `.env` (local dev, gitignored)

`bun run dev` reads `.env`. A working `.env` is present on the VM snapshot with
`DATABASE_URL=postgresql://playwolf:playwolf@localhost:5432/playwolf`, a generated
`PAYLOAD_SECRET`, and `S3_*` pointing at the local Garage (`S3_ENDPOINT=http://localhost:3900`).
If it is missing, copy [`.env.example`](.env.example) and fill those values. `S3_*` only
fails at _upload time_, so the app still boots and renders without Garage running.

### Non-obvious gotchas

- **Schema is auto-pushed in dev.** With `NODE_ENV` unset/development the Postgres adapter
  pushes schema changes directly on first connect — do **not** run `bun run migrate` locally
  (migrations only apply in production via `prodMigrations`). The first request after boot
  is slow ("Pulling schema from database…") while it syncs.
- **First `/admin` visit on an empty DB** shows the custom admin's "create first user" form —
  there is no seed/CLI step. `smoke-seed.ts` seeds sample content but does not create a user.
  The stock Payload admin UI is removed; `/admin` is a schema-driven studio over the Local API.
- **Commission reminders** hit `GET/POST /api/cron/commission-reminders` with
  `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret`). Schedule daily in Coolify.
- **Frontend content is cached with `unstable_cache`** and refreshed via `revalidateTag`
  hooks on save. After creating/editing content in `/admin`, the public page (e.g.
  `/projects`) can lag by a moment; reload after a second and it appears. This is expected,
  not a bug.
- **No email adapter** is configured, so Payload logs "No email adapter provided" and writes
  emails to the console — harmless in dev.
- **Lint/test/build need no services**: `bun run lint`, `bun run format:check`, `bun test`,
  `bun run typecheck`, and `bun run build` all run without Postgres or Garage.
