import { permanentRedirect } from "next/navigation";

/** Keep old bookmarks useful without maintaining a standalone Friends page. */
export default function FriendsRedirect() {
  permanentRedirect("/gallery");
}
