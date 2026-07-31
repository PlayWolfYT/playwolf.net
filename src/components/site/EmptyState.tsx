import type { ReactNode } from "react";

/** Dashed placeholder for a section with nothing in it yet. */
export function EmptyState({
  children,
  description,
  title,
}: {
  children?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/[0.1] bg-void-lift/40 px-8 py-16 text-center">
      <p className="font-display text-lg font-medium text-parchment">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-parchment-muted">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
