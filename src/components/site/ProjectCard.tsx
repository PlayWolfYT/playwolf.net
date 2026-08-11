import Link from "next/link";

import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { placeholderFor, PROJECT_STATUS_LABELS, type Project } from "@/lib/content";

/** Only states worth calling out get a badge; "live" is the unremarkable case. */
const BADGE_CLASS: Partial<Record<Project["status"], string>> = {
  wip: "border-glow-500/35 bg-glow-500/10 text-glow-400",
  planned: "border-white/15 bg-white/[0.04] text-parchment-dim",
  archived: "border-white/10 bg-white/[0.02] text-parchment-dim/70",
};

export function ProjectCard({ project }: { project: Project }) {
  const badgeClass = BADGE_CLASS[project.status];

  return (
    <SpotlightCard>
      <Link
        href={`/projects/${project.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 shadow-glow-sm backdrop-blur-xl transition hover:border-glow-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-lift/60">
          {project.cover ? (
            <ShimmerImage
              src={project.cover}
              alt=""
              aria-hidden
              fill
              placeholder={placeholderFor(project.cover)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-grid-soft bg-[size:34px_34px] opacity-70" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-medium tracking-tight text-parchment">
              {project.title}
            </h2>
            {badgeClass ? (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium ${badgeClass}`}
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            ) : null}
          </div>

          {project.summary ? (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-parchment-muted">
              {project.summary}
            </p>
          ) : null}

          {project.year ? (
            <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
              {project.year}
            </p>
          ) : null}
        </div>
      </Link>
    </SpotlightCard>
  );
}
