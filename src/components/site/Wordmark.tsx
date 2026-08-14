import Image from "next/image";

import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/favicon.ico"
        width={36}
        height={36}
        alt=""
        unoptimized
        className="size-9 shrink-0 rounded-lg shadow-glow-sm"
      />
      <span
        className={cn(
          "font-display text-sm font-bold leading-none tracking-[-0.04em] text-foreground",
          compact && "sr-only sm:not-sr-only",
        )}
      >
        playwolf.net
      </span>
    </span>
  );
}
