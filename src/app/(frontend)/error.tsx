"use client";

import { ErrorPageFrame, errorActionClassName } from "@/components/ErrorPageFrame";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPageFrame
      eyebrow="Something went wrong"
      title="We hit a snag"
      description="An unexpected error occurred while loading this page. You can try again—if it keeps happening, check back later."
    >
      <button type="button" onClick={reset} className={errorActionClassName}>
        Try again
      </button>
      {process.env.NODE_ENV === "development" && error.message ? (
        <p className="basis-full wrap-break-word text-center font-mono text-[11px] leading-relaxed text-coral-soft/85">
          {error.message}
        </p>
      ) : null}
    </ErrorPageFrame>
  );
}
