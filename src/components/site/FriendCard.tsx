import Image from "next/image";
import Link from "next/link";

import { placeholderFor, type Friend } from "@/lib/content";
import { LinkRow } from "@/components/site/LinkRow";
import { RichTextContent } from "@/lib/rich-text";

/**
 * The `id` is what "featuring" chips on an artwork jump to, so a friend's card
 * is one click away from any picture they appear in.
 */
export function FriendCard({ friend }: { friend: Friend }) {
  return (
    <article
      id={friend.slug}
      className="flex h-full scroll-mt-24 flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 shadow-glow-sm backdrop-blur-xl"
    >
      {friend.image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-void-lift/60">
          <Image
            src={friend.image}
            alt=""
            aria-hidden
            fill
            placeholder={placeholderFor(friend.image)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover object-top"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="font-display text-lg font-medium tracking-tight text-parchment">
          {friend.name}
        </h2>

        {friend.description ? (
          <RichTextContent
            className="flex-1 text-sm leading-relaxed text-parchment-muted"
            value={friend.description}
          />
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/gallery?friend=${friend.slug}`}
            className="text-xs font-medium uppercase tracking-[0.2em] text-glow-400 transition hover:text-glow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
          >
            See artwork
          </Link>
          <LinkRow links={friend.links} />
        </div>
      </div>
    </article>
  );
}
