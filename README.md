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

## Production

```bash
bun run build
bun run start
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Coolify / Garage
production bootstrap.
