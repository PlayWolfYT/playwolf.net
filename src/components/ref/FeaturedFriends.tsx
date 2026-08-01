import Image from "next/image";
import Link from "next/link";

import { LinkRow } from "@/components/site/LinkRow";
import { placeholderFor, type Example, type FeaturedFriend } from "@/lib/content";
import { RichTextContent } from "@/lib/rich-text";

function isFriend(person: Example["featuring"][number]): person is FeaturedFriend {
  return person.kind === "friend";
}

/** Full friend profiles shown in the context of the artwork they appear in. */
export function FeaturedFriends({ example }: { example: Example }) {
  const friends = example.featuring.filter(isFriend);
  if (friends.length === 0) return null;

  return (
    <section className="mt-16 w-full" aria-labelledby="featured-friends-heading">
      <header className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-glow-500">
          In this artwork
        </p>
        <h2
          id="featured-friends-heading"
          className="mt-2 font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl"
        >
          Featured friends
        </h2>
      </header>

      <ul className="space-y-6">
        {friends.map((friend, index) => {
          const imageOnRight = index % 2 === 1;

          return (
            <li key={friend.slug}>
              <article
                id={`friend-${friend.slug}`}
                className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 shadow-glow-sm backdrop-blur-xl md:grid md:min-h-72 md:grid-cols-2"
              >
                {friend.image ? (
                  <div
                    className={`relative min-h-64 overflow-hidden bg-void-lift/60 md:min-h-full ${
                      imageOnRight ? "md:order-2" : ""
                    }`}
                  >
                    <Image
                      src={friend.image}
                      alt={`${friend.name} portrait`}
                      fill
                      placeholder={placeholderFor(friend.image)}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-top"
                    />
                  </div>
                ) : null}

                <div
                  className={`flex flex-col justify-center gap-4 p-6 sm:p-8 ${
                    imageOnRight && friend.image ? "md:order-1" : ""
                  } ${friend.image ? "" : "md:col-span-2"}`}
                >
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-parchment">
                    {friend.name}
                  </h3>

                  {friend.description ? (
                    <RichTextContent
                      className="text-sm leading-relaxed text-parchment-muted sm:text-base"
                      value={friend.description}
                    />
                  ) : null}

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={`/gallery?friend=${encodeURIComponent(friend.slug)}`}
                      className="inline-flex min-h-11 items-center text-xs font-medium uppercase tracking-[0.2em] text-glow-400 transition hover:text-glow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
                    >
                      More artwork
                    </Link>
                    <LinkRow className="justify-start" links={friend.links} />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
