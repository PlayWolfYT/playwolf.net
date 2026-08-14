import type { Metadata } from "next";

import { EmptyState } from "@/components/site/EmptyState";
import { PageHeader } from "@/components/site/PageHeader";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getProjects } from "@/lib/references";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things built, in progress, and planned.",
  alternates: { canonical: "/projects" },
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
        <div className="mt-12">
          <EmptyState
            title="Nothing here yet"
            description="Projects will appear here as they are ready."
          />
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
