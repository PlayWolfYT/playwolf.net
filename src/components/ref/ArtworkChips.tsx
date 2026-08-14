import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Example } from "@/lib/content";

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
        <Badge
          key={`${person.kind}-${person.slug}`}
          variant="outline"
          className="border-glow-500/30 bg-glow-500/[0.06] [a]:hover:border-glow-400/60 [a]:hover:bg-glow-500/15"
          render={
            <Link
              href={
                person.kind === "character"
                  ? `/ref/${person.slug}`
                  : `#friend-${person.slug}`
              }
            />
          }
        >
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-primary">
            {person.kind === "character" ? "OC" : "Friend"}
          </span>
          {person.name}
        </Badge>
      ))}

      {tags.map((tag) => (
        <Badge
          key={tag.slug}
          variant="outline"
          className="border-glow-500/30 bg-glow-500/10 text-glow-300 [a]:hover:border-glow-400/60 [a]:hover:bg-glow-500/18"
          render={<Link href={`/gallery?tag=${encodeURIComponent(tag.slug)}`} />}
        >
          #{tag.label}
        </Badge>
      ))}
    </div>
  );
}
