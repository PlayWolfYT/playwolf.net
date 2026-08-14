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
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <PageHeader
        eyebrow="Build log"
        title="Projects"
        lede="Web experiments, useful tools, and ideas moving from sketchbook to release."
      />

      {projects.length === 0 ? (
        <Empty className="mt-10 min-h-80 border bg-card/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanbanIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing has shipped yet</EmptyTitle>
            <EmptyDescription>
              Projects will appear here when they are ready to leave the studio.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ProjectBoard projects={projects} />
      )}
    </div>
  );
}
