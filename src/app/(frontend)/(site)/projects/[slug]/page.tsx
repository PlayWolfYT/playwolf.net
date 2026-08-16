import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { absoluteUrl, JsonLd, type JsonLdNode } from "@/components/site/JsonLd";
import { LinkRow } from "@/components/site/LinkRow";
import { PageHeader } from "@/components/site/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROJECT_STATUS_LABELS, placeholderFor, type Project } from "@/lib/content";
import { buildImageMetadata } from "@/lib/embed";
import { getProject } from "@/lib/references";
import {
  RichTextContent,
  richTextToMetaDescription,
  richTextToPlainText,
  truncateForMetaDescription,
} from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  // `summary` is an unbounded textarea, so it needs clipping as much as the
  // rich-text fallback does.
  const description =
    truncateForMetaDescription(project.summary) ??
    richTextToMetaDescription(project.body);
  const pagePath = `/projects/${project.slug}`;

  if (!project.cover) {
    return { title: project.title, description, alternates: { canonical: pagePath } };
  }

  return buildImageMetadata({
    title: project.title,
    image: project.cover,
    alt: project.title,
    description,
    pagePath,
  });
}

function projectGraph(project: Project): JsonLdNode {
  return {
    "@type": "CreativeWork",
    name: project.title,
    url: absoluteUrl(`/projects/${project.slug}`),
    // Untruncated on purpose: the meta description has a display budget, this
    // does not.
    description: project.summary ?? richTextToPlainText(project.body),
    image: project.cover ? absoluteUrl(project.cover.src) : undefined,
    dateModified: project.updatedAt,
    creativeWorkStatus: PROJECT_STATUS_LABELS[project.status],
    ...(project.year ? { copyrightYear: project.year } : {}),
    author: { "@type": "Person", name: "playwolf" },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <JsonLd nodes={projectGraph(project)} />

      <PageHeader
        eyebrow={PROJECT_STATUS_LABELS[project.status]}
        title={project.title}
        lede={project.summary}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{project.year ?? "Ongoing"}</Badge>
          {project.featured ? <Badge variant="secondary">Featured</Badge> : null}
        </div>
      </PageHeader>

      {project.cover ? (
        <Card className="mt-10 gap-0 py-0">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <ShimmerImage
              src={project.cover.src}
              alt={project.title}
              fill
              // This route's LCP element.
              priority
              unoptimized={project.cover.unoptimized}
              placeholder={placeholderFor(project.cover)}
              blurDataURL={project.cover.blurDataURL}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-contain object-center"
            />
          </div>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {project.body ? (
          <Card className="[--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(10)]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-[-0.045em]">
                Project notes
              </CardTitle>
              <CardDescription>Process, context, and release details.</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextContent
                className="max-w-3xl text-base leading-8 text-muted-foreground"
                value={project.body}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="min-h-56 justify-center">
            <CardHeader>
              <CardTitle>Notes incoming</CardTitle>
              <CardDescription>
                This project does not have a write-up yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Project links</CardTitle>
            <CardDescription>Open this project somewhere else.</CardDescription>
          </CardHeader>
          <CardContent>
            {project.links.length > 0 ? (
              <LinkRow links={project.links} align="start" />
            ) : (
              <p className="text-sm text-muted-foreground">
                No external links are attached.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-xl",
          )}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          All projects
        </Link>
      </div>
    </article>
  );
}
