import type { Metadata } from "next";
import { FolderKanbanIcon } from "lucide-react";

import { PageHeader } from "@/components/site/PageHeader";
import { ProjectBoard } from "@/components/site/ProjectBoard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getProjects } from "@/lib/references";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things built, in progress, and planned.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <PageHeader
        eyebrow="Things I make"
        title="Projects"
        lede="Web experiments, useful tools, and ideas I wanted to try for myself."
      />

      {projects.length === 0 ? (
        <Empty className="mt-10 min-h-80 border bg-card/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanbanIcon />
            </EmptyMedia>
            <EmptyTitle>No projects here yet</EmptyTitle>
            <EmptyDescription>
              I&rsquo;ll add them whenever there is something worth sharing.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ProjectBoard projects={projects} />
      )}
    </div>
  );
}
