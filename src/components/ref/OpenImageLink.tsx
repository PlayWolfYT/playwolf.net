import type { ImageRef } from "@/lib/content";
import { ExternalLinkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OpenImageLinkProps = {
  image: ImageRef;
  /** Link text. Defaults to "Open full image". */
  label?: string;
};

/**
 * Opens the untouched upload in a new tab — used under example artwork and
 * reference sheets alike, so the raw file is always one click away. This is the
 * only place the original is ever referenced; everything on the page itself
 * renders a bounded derivative.
 */
export function OpenImageLink({
  image,
  label = "Open full image",
}: OpenImageLinkProps) {
  return (
    <a
      href={image.original.url}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: "default", size: "lg" }), "rounded-xl")}
    >
      {label}
      <ExternalLinkIcon data-icon="inline-end" />
    </a>
  );
}
