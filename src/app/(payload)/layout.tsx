import React from "react";

/**
 * Payload admin UI is replaced by a custom `/admin` app. This layout only
 * wraps the REST/GraphQL route handlers under `(payload)/api` — no RootLayout,
 * import map, or admin chrome.
 */
export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
