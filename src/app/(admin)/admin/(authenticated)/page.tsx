import Link from "next/link";

import { getPayloadClient } from "@/lib/payload";
import type { Artwork } from "@/payload-types";

export const metadata = { title: "Dashboard" };

async function loadDashboard() {
  const payload = await getPayloadClient();

  const [
    artworks,
    characters,
    artists,
    friends,
    tags,
    projects,
    media,
    users,
    inProgress,
    recent,
  ] = await Promise.all([
    payload.count({ collection: "artworks", overrideAccess: true }),
    payload.count({ collection: "characters", overrideAccess: true }),
    payload.count({ collection: "artists", overrideAccess: true }),
    payload.count({ collection: "friends", overrideAccess: true }),
    payload.count({ collection: "tags", overrideAccess: true }),
    payload.count({ collection: "projects", overrideAccess: true }),
    payload.count({ collection: "media", overrideAccess: true }),
    payload.count({ collection: "users", overrideAccess: true }),
    payload.find({
      collection: "artworks",
      where: { lifecycle: { equals: "in_progress" } },
      depth: 1,
      limit: 20,
      sort: "-updatedAt",
      overrideAccess: true,
    }),
    payload.find({
      collection: "artworks",
      depth: 1,
      limit: 6,
      sort: "-updatedAt",
      overrideAccess: true,
    }),
  ]);

  return {
    counts: {
      artworks: artworks.totalDocs,
      characters: characters.totalDocs,
      artists: artists.totalDocs,
      friends: friends.totalDocs,
      tags: tags.totalDocs,
      projects: projects.totalDocs,
      media: media.totalDocs,
      users: users.totalDocs,
    },
    inProgress: inProgress.docs as Artwork[],
    recent: recent.docs as Artwork[],
  };
}

function characterName(character: Artwork["character"]): string {
  return typeof character === "object" ? character.name : `#${character}`;
}

export default async function AdminDashboardPage() {
  const { counts, inProgress, recent } = await loadDashboard();

  const cards: { label: string; href: string; value: number }[] = [
    { label: "Artworks", href: "/admin/collections/artworks", value: counts.artworks },
    {
      label: "Characters",
      href: "/admin/collections/characters",
      value: counts.characters,
    },
    { label: "Artists", href: "/admin/collections/artists", value: counts.artists },
    { label: "Friends", href: "/admin/collections/friends", value: counts.friends },
    { label: "Tags", href: "/admin/collections/tags", value: counts.tags },
    { label: "Projects", href: "/admin/collections/projects", value: counts.projects },
    { label: "Media", href: "/admin/collections/media", value: counts.media },
    { label: "Users", href: "/admin/collections/users", value: counts.users },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-glow-500">
          Overview
        </p>
        <h1 className="mt-2 font-display text-2xl font-light tracking-tight text-parchment sm:text-3xl">
          Dashboard
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4 shadow-inner-glow transition hover:border-glow-500/30"
          >
            <p className="font-display text-2xl font-light text-parchment">
              {card.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-parchment-dim">
              {card.label}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 shadow-inner-glow sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-medium tracking-wide text-parchment">
            In-progress commissions
          </h2>
          <Link
            href="/admin/collections/artworks"
            className="text-xs text-glow-400 hover:text-glow-300"
          >
            View all →
          </Link>
        </header>

        {inProgress.length === 0 ? (
          <p className="text-sm text-parchment-dim">Nothing in progress right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inProgress.map((artwork) => (
              <li
                key={artwork.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-void-lift/40 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/admin/collections/artworks/${artwork.id}`}
                    className="text-sm text-parchment hover:text-glow-300"
                  >
                    {artwork.title}
                  </Link>
                  <p className="text-xs text-parchment-dim">
                    {characterName(artwork.character)} · {artwork.profile}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {artwork.commission?.paid ? (
                    <span className="rounded-full border border-glow-500/30 bg-glow-500/10 px-2 py-0.5 text-glow-300">
                      Paid
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-parchment-dim">
                      Unpaid
                    </span>
                  )}
                  {artwork.commission?.artistStarted ? (
                    <span className="rounded-full border border-glow-500/30 bg-glow-500/10 px-2 py-0.5 text-glow-300">
                      Started
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 shadow-inner-glow sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-medium tracking-wide text-parchment">
            Recently updated artworks
          </h2>
          <Link
            href="/admin/collections/artworks"
            className="text-xs text-glow-400 hover:text-glow-300"
          >
            View all →
          </Link>
        </header>

        <ul className="flex flex-col gap-2">
          {recent.map((artwork) => (
            <li key={artwork.id}>
              <Link
                href={`/admin/collections/artworks/${artwork.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-void-lift/40 px-3 py-2 text-sm text-parchment-muted transition hover:border-glow-500/30 hover:text-parchment"
              >
                <span>{artwork.title}</span>
                <span className="text-xs text-parchment-dim">
                  {characterName(artwork.character)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
