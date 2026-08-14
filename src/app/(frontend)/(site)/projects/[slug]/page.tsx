import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackArrow } from "@/components/ref/BackArrow";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { absoluteUrl, JsonLd, type JsonLdNode } from "@/components/site/JsonLd";
import { LinkRow } from "@/components/site/LinkRow";
import { buildImageMetadata } from "@/lib/embed";
import { placeholderFor, PROJECT_STATUS_LABELS, type Project } from "@/lib/content";
import { getProject } from "@/lib/references";
import {
  RichTextContent,
  richTextToMetaDescription,
  richTextToPlainText,
  truncateForMetaDescription,
} from "@/lib/rich-text";

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
    <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <JsonLd nodes={projectGraph(project)} />

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
            src={project.cover.src}
            alt={project.title}
            fill
            // This route's LCP element.
            priority
            unoptimized={project.cover.unoptimized}
            placeholder={placeholderFor(project.cover)}
            blurDataURL={project.cover.blurDataURL}
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain object-center"
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
