"use client";

import { useRowLabel } from "@payloadcms/ui";

type LinkRow = {
  description?: string;
  kind?: string;
  url?: string;
};

/** Collapsed array rows read "twitter — https://…" instead of "Link 01". */
export const LinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<LinkRow>();
  const position = String((rowNumber ?? 0) + 1).padStart(2, "0");

  if (!data?.kind && !data?.url) return <span>Link {position}</span>;

  return (
    <span>
      {data.kind ?? "link"}
      {data.url ? ` — ${data.url}` : ""}
      {data.description ? ` (${data.description.split("\n")[0]})` : ""}
    </span>
  );
};

export default LinkRowLabel;
