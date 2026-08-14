import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  label?: string;
  /** Stable destination for this page's parent view. */
  fallbackHref?: string;
};

export function BackButton({ label = "Back", fallbackHref = "/" }: BackButtonProps) {
  return (
    <Link
      href={fallbackHref}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
    >
      <ArrowLeftIcon data-icon="inline-start" />
      {label}
    </Link>
  );
}
