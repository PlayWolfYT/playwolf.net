import type { Example } from "@/lib/content";
import { Layers2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Corner chip on grid thumbs for pieces with same-rating alternate versions.
 * The count includes the main image, so "2" reads as "two versions in total".
 * Cross-rating counterparts (slides carrying a `profile`) are excluded — an
 * SFW card must not advertise or count its After Dark twin.
 */
export function VersionBadge({ example }: { example: Example }) {
  const sameRating = example.alts.filter((slide) => !slide.profile);
  if (sameRating.length === 0) return null;
  const count = sameRating.length + 1;

  return (
    <Badge className="absolute right-2 top-2 z-20">
      <Layers2Icon data-icon="inline-start" />
      {count}
      <span className="sr-only">versions</span>
    </Badge>
  );
}
