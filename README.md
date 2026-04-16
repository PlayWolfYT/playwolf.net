# playwolf.net

Next.js site for playwolf.net with Tailwind CSS. Dependencies and scripts use [Bun](https://bun.sh). Maintenance mode is controlled by an environment variable so you can flip it per environment without code changes.

## Development

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Lint with `bun run lint`.

## Maintenance mode

Copy `.env.example` to `.env.local` and set:

```bash
MAINTENANCE_MODE=true
```

Truthy values: `true`, `1`, or `yes` (case-insensitive). Anything else (or unset) shows the early-access placeholder instead.

To preview the non-maintenance page locally, set `MAINTENANCE_MODE=false` or remove the variable.

## Production

```bash
bun run build
bun run start
```

Set `MAINTENANCE_MODE` in your host’s environment (for example Vercel project settings) when you need the maintenance screen.