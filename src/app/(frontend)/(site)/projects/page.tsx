import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getProjects } from "@/lib/references";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things built, in progress, and planned.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageHeader
        eyebrow="playwolf.net"
        title="Projects"
        lede="Things built, in progress, and planned."
      />

      {projects.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-white/[0.1] bg-void-lift/40 px-8 py-16 text-center">
          <p className="font-display text-lg font-medium text-parchment">
            Nothing here yet
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-parchment-muted">
            Projects will appear here as they are ready.
          </p>
        </div>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
