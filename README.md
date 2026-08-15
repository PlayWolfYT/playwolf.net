# playwolf.net

Next.js site for playwolf.net with Tailwind CSS and Payload CMS. Dependencies and
scripts use [Bun](https://bun.sh).

## Development

Requires Docker Desktop (for Postgres + Garage) and Bun.

```bash
bun install
cp .env.example .env   # if you do not already have a .env
bun run dev:up         # start Postgres + Garage, bootstrap the media bucket
bun run dev            # Next.js + Payload on http://localhost:3000
```

`bun run dev:up` layers [`docker-compose.dev.yml`](docker-compose.dev.yml) on
[`docker-compose.yml`](docker-compose.yml) so Postgres (`5432`) and Garage
(`7900` S3 / `7903` admin on the host → container `3900` / `3903`) are
published on loopback only, then runs
[`scripts/garage-bootstrap.ts`](scripts/garage-bootstrap.ts) to assign the
single-node layout, create the `playwolf-media` bucket, and import the pinned
local S3 credentials from `.env`.

Tear the stack down with `bun run dev:down`. Re-running `dev:up` is safe — the
bootstrap is idempotent.

Open [http://localhost:3000](http://localhost:3000). Admin lives at
[`/admin`](http://localhost:3000/admin). Lint with `bun run lint`.

Maintenance mode is toggled under **Site settings → Status** in the admin — it
is not an environment variable.

### Seed data

With Postgres and Garage running, populate every public content area plus an
admin account:

```bash
bun run seed
```

The command is idempotent: it updates its named fixtures, repairs any seeded
upload whose Garage objects are missing, and leaves unrelated content alone.
Placeholder uploads come from [`placehold.co`](https://placehold.co) and are
labelled and colour-coded for the state they represent; an equivalent image is
generated locally if that service is unavailable. If Next is running, the seed
also invalidates its content and route caches (`SEED_FRONTEND_URL` overrides the
default `http://localhost:3000`).

Fixtures use descriptive prefixes (`CH`, `ART`, `FR`, `AR`, `TG`, and `PR`) and
state exactly what they cover, such as `CH Single SFW Profile - Without Ref`.
The scenario catalog is explicit so coverage remains reviewable, while shared
loops handle repetitive upserts. Use `seed:fresh` after adding, removing, or
renaming scenarios so retired fixtures do not remain beside the new matrix.

For a completely clean fixture database, stop the dev server and run:

```bash
bun run seed:fresh
```

This deletes uploads through Payload (including Garage objects), drops and
rebuilds the Payload database schema, and seeds it again. Restart the dev server
afterward so it cannot retain pre-seed cached content.

The development login is `testing@testing.com` / `testing`. Override
it with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Production seeding is
blocked unless `SEED_ALLOW_PRODUCTION=true`; destructive production or remote
resets additionally require `SEED_ALLOW_DESTRUCTIVE=true`.

## Production

```bash
bun run build
bun run start
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Coolify / Garage
production bootstrap.
