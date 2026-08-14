import Link from "next/link";

import type { Example } from "@/lib/content";

const CHIP_CLASS =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-void/70 px-3 py-1.5 text-xs text-parchment-muted transition hover:border-glow-500/40 hover:text-parchment focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";

/**
 * Who is in the picture and what it is about, as links out. Characters go to
 * their reference page; friends jump to their profile below this artwork; tags
 * open the gallery narrowed to that tag.
 */
export function ArtworkChips({ example }: { example: Example }) {
  const people = example.featuring;
  const { tags } = example;
  if (people.length === 0 && tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {people.map((person) => (
        <Link
          key={`${person.kind}-${person.slug}`}
          href={
            person.kind === "character"
              ? `/ref/${person.slug}`
              : `#friend-${person.slug}`
          }
          className={CHIP_CLASS}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-glow-500">
            {person.kind === "character" ? "OC" : "Friend"}
          </span>
          {person.name}
        </Link>
      ))}

      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={`/gallery?tag=${encodeURIComponent(tag.slug)}`}
          className={CHIP_CLASS}
        >
          <span aria-hidden className="text-parchment-dim">
            #
          </span>
          {tag.label}
        </Link>
      ))}
    </div>
  );
}
