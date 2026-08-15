"use client";

import { ProjectCard } from "@/components/site/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_STATUS_LABELS, type Project } from "@/lib/content";

const STATUS_ORDER: Project["status"][] = ["live", "wip", "planned", "archived"];

export function ProjectBoard({ projects }: { projects: Project[] }) {
  const groups = STATUS_ORDER.flatMap((status) => {
    const items = projects.filter((project) => project.status === status);
    return items.length > 0
      ? [{ key: status, label: PROJECT_STATUS_LABELS[status], items }]
      : [];
  });

  return (
    <Tabs defaultValue="all" className="mt-10">
      <TabsList
        variant="line"
        aria-label="Filter projects by status"
        className="w-full justify-start overflow-x-auto border-b border-border pb-3"
      >
        <TabsTrigger value="all">
          All
          <Badge variant="outline">{projects.length}</Badge>
        </TabsTrigger>
        {groups.map((group) => (
          <TabsTrigger key={group.key} value={group.key}>
            {group.label}
            <Badge variant="outline">{group.items.length}</Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="mt-8">
        <ProjectGrid projects={projects} />
      </TabsContent>
      {groups.map((group) => (
        <TabsContent key={group.key} value={group.key} className="mt-8">
          <ProjectGrid projects={group.items} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.slug}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
