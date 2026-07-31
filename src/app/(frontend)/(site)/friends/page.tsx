import type { Metadata } from "next";

import { EmptyState } from "@/components/site/EmptyState";
import { FriendCard } from "@/components/site/FriendCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getFriends } from "@/lib/references";

export const metadata: Metadata = {
  title: "Friends",
  description: "Characters belonging to friends who show up in the artwork.",
};

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageHeader
        eyebrow="Good company"
        title="Friends"
        lede="Characters that aren't mine, and the people they belong to."
      />

      <div className="mt-12">
        {friends.length === 0 ? (
          <EmptyState
            title="Nobody here yet"
            description="Friends will show up here as their characters appear in the gallery."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <li key={friend.slug}>
                <FriendCard friend={friend} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
