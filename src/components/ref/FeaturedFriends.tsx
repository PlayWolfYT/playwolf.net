import Image from "next/image";
import Link from "next/link";

import { LinkRow } from "@/components/site/LinkRow";
import { buttonVariants } from "@/components/ui/button";
import { placeholderFor, type Example, type FeaturedFriend } from "@/lib/content";
import { RichTextContent } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

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

      <ul className="flex flex-col gap-6">
        {friends.map((friend, index) => {
          const imageOnRight = index % 2 === 1;

          return (
            <li key={friend.slug}>
              <article
                id={`friend-${friend.slug}`}
                className="scroll-mt-24 overflow-hidden rounded-2xl border border-glow-500/25 bg-glow-500/[0.055] shadow-[0_24px_70px_-48px_rgb(var(--accent-500)/0.9)] backdrop-blur-sm md:grid md:grid-cols-2 md:items-center"
              >
                {friend.image ? (
                  <div
                    className={`relative aspect-5/2 w-full overflow-hidden bg-void-lift/60 ${
                      imageOnRight ? "md:order-2" : ""
                    }`}
                  >
                    {/*
                      Pre-baked 5:2 crop. Serve the file URL directly (no
                      `/_next/image`) and use contain so layout cannot apply a
                      second cover-crop on top of the admin selection.
                    */}
                    <Image
                      src={friend.image.src}
                      alt={`${friend.name} banner`}
                      fill
                      unoptimized={friend.image.unoptimized}
                      placeholder={placeholderFor(friend.image)}
                      blurDataURL={friend.image.blurDataURL}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain object-center"
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

                  <div className="mt-auto flex flex-col items-end gap-2 pt-4">
                    <Link
                      href={`/gallery?friend=${encodeURIComponent(friend.slug)}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-xl border-glow-500/30 bg-glow-500/[0.06] text-glow-300 hover:border-glow-400/60 hover:bg-glow-500/15 hover:text-glow-300",
                      )}
                    >
                      More artwork
                    </Link>
                    <LinkRow
                      align="end"
                      links={friend.links}
                      className="[&_a]:border-glow-500/30 [&_a]:bg-glow-500/8 [&_a]:text-glow-300 [&_a]:hover:border-glow-400/60 [&_a]:hover:bg-glow-500/15"
                    />
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
