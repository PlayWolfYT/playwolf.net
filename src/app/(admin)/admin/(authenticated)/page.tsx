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
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow"
          >
            <p className="text-2xl font-semibold text-zinc-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            In-progress commissions
          </h2>
          <Link
            href="/admin/collections/artworks"
            className="text-xs font-medium text-sky-700 hover:text-sky-800"
          >
            View all →
          </Link>
        </header>

        {inProgress.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing in progress right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inProgress.map((artwork) => (
              <li
                key={artwork.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/admin/collections/artworks/${artwork.id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-sky-700"
                  >
                    {artwork.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {characterName(artwork.character)} · {artwork.profile}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {artwork.commission?.paid ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                      Paid
                    </span>
                  ) : (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500">
                      Unpaid
                    </span>
                  )}
                  {artwork.commission?.artistStarted ? (
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                      Started
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Recently updated artworks
          </h2>
          <Link
            href="/admin/collections/artworks"
            className="text-xs font-medium text-sky-700 hover:text-sky-800"
          >
            View all →
          </Link>
        </header>

        <ul className="flex flex-col gap-2">
          {recent.map((artwork) => (
            <li key={artwork.id}>
              <Link
                href={`/admin/collections/artworks/${artwork.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="font-medium">{artwork.title}</span>
                <span className="text-xs text-zinc-500">
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
