import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { placeholderFor, PROJECT_STATUS_LABELS, type Project } from "@/lib/content";

const BADGE_VARIANT: Record<
  Project["status"],
  "default" | "secondary" | "outline" | "ghost"
> = {
  live: "outline",
  wip: "default",
  planned: "secondary",
  archived: "ghost",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <SpotlightCard>
      <Link
        href={`/projects/${project.slug}`}
        className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Card className="h-full gap-0 py-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/45">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {project.cover ? (
              <ShimmerImage
                src={project.cover.src}
                alt=""
                aria-hidden
                fill
                unoptimized={project.cover.unoptimized}
                placeholder={placeholderFor(project.cover)}
                blurDataURL={project.cover.blurDataURL}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                className="object-contain transition duration-500 group-hover:scale-[1.035]"
                style={{ objectPosition: project.cover.objectPosition }}
              />
            ) : (
              <div className="flex h-full items-end bg-grid-soft bg-size-[32px_32px] p-5">
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Image pending
                </span>
              </div>
            )}
          </div>

          <CardHeader className="border-t border-border pt-(--card-spacing)">
            <CardTitle>
              <h2 className="font-display text-xl font-bold tracking-[-0.045em]">
                {project.title}
              </h2>
            </CardTitle>
            <CardAction>
              <Badge variant={BADGE_VARIANT[project.status]}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </CardAction>
            {project.summary ? (
              <CardDescription className="mt-2 line-clamp-3 leading-relaxed">
                {project.summary}
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardFooter className="mt-auto justify-between gap-3">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
              {project.year ?? "Ongoing"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              View project
              <ArrowUpRightIcon aria-hidden />
            </span>
          </CardFooter>
        </Card>
      </Link>
    </SpotlightCard>
  );
}
