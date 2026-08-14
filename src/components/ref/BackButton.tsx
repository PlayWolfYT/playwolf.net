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
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "rounded-xl border-glow-500/30 bg-glow-500/[0.06] text-glow-300 shadow-[0_14px_35px_-25px_rgb(var(--accent-500)/0.9)] hover:border-glow-400/60 hover:bg-glow-500/15 hover:text-glow-300",
      )}
    >
      <ArrowLeftIcon data-icon="inline-start" />
      {label}
    </Link>
  );
}
