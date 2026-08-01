import Link from "next/link";
import { BackArrow } from "./BackArrow";

type BackButtonProps = {
  label?: string;
  /** Stable destination for this page's parent view. */
  fallbackHref?: string;
};

export function BackButton({ label = "Back", fallbackHref = "/" }: BackButtonProps) {
  return (
    <Link
      href={fallbackHref}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      <BackArrow />
      {label}
    </Link>
  );
}
