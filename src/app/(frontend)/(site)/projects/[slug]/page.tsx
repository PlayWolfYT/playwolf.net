import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShimmerImage } from "@/components/ref/ShimmerImage";
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
import { PROJECT_STATUS_LABELS, placeholderFor } from "@/lib/content";
import { buildImageMetadata } from "@/lib/embed";
import { getProject } from "@/lib/references";
import { RichTextContent, richTextToPlainText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  const description = project.summary ?? richTextToPlainText(project.body);
  if (!project.cover) return { title: project.title, description };

  return buildImageMetadata({
    title: project.title,
    image: project.cover,
    alt: project.title,
    description,
    pagePath: `/projects/${project.slug}`,
  });
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
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
            <CardDescription>Continue outside the archive.</CardDescription>
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
