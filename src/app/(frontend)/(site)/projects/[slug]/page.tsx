import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackArrow } from "@/components/ref/BackArrow";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { LinkRow } from "@/components/site/LinkRow";
import { buildImageMetadata } from "@/lib/embed";
import { placeholderFor, PROJECT_STATUS_LABELS } from "@/lib/content";
import { getProject } from "@/lib/references";
import { RichTextContent, richTextToPlainText } from "@/lib/rich-text";

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
    <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <header className="text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-glow-500">
          {PROJECT_STATUS_LABELS[project.status]}
          {project.year ? ` · ${project.year}` : ""}
        </p>
        <h1 className="mt-4 font-display text-3xl font-light tracking-tight text-parchment sm:text-4xl">
          {project.title}
        </h1>
        {project.summary ? (
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-parchment-muted">
            {project.summary}
          </p>
        ) : null}
      </header>

      {project.cover ? (
        <div className="relative mt-12 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/[0.07] bg-void-lift/60 shadow-glow-sm">
          <ShimmerImage
            src={project.cover}
            alt={project.title}
            fill
            placeholder={placeholderFor(project.cover)}
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      {project.body ? (
        <RichTextContent
          className="mt-12 text-sm leading-relaxed text-parchment-muted"
          value={project.body}
        />
      ) : null}

      <LinkRow className="mt-12" links={project.links} />

      <div className="mt-14 flex justify-center">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          <BackArrow />
          All projects
        </Link>
      </div>
    </article>
  );
}
