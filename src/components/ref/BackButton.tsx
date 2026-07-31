"use client";

import { usePathname, useRouter } from "next/navigation";
import { BackArrow } from "./BackArrow";
import Link from "next/link";

type BackButtonProps = {
  label?: string;
  /** Where to go when there's no history to return to (direct load) */
  fallbackHref?: string;
};

export function BackButton({ label = "Back", fallbackHref = "/" }: BackButtonProps) {
  // Get the previous page based on the URL slash-separated path segments
  const pathname = usePathname();
  const previousPath = pathname.split("/").slice(0, -1).join("/");

  return (
    <Link
      href={previousPath || fallbackHref}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      <BackArrow />
      {label}
    </Link>
  );
}
