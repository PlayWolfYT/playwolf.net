import type { ReactNode } from "react";
import { SearchXIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/** Dashed placeholder for a section with nothing in it yet. */
export function EmptyState({
  children,
  className,
  description,
  title,
}: {
  children?: ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <Empty className={cn("min-h-80 border bg-card/70", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
