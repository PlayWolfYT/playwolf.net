"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
  /** Where to go when there's no history to return to (direct load) */
  fallbackHref?: string;
};

export function BackButton({
  label = "Back",
  fallbackHref = "/ref",
}: BackButtonProps) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
