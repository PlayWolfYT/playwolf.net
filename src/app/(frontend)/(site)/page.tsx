import { ArrowRightIcon, ArrowUpRightIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

import { Bubble } from "@/components/canvasui/Bubble";
import { Canvas } from "@/components/canvasui/Canvas";
import { BlurText } from "@/components/motion/BlurText";
import { Reveal } from "@/components/motion/Reveal";
import { CharacterCard } from "@/components/ref/CharacterCard";
import { LinkRow } from "@/components/site/LinkRow";
import { ProjectCard } from "@/components/site/ProjectCard";
import { buttonVariants } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { getCharacters, getProjects, getSiteSettings } from "@/lib/references";
import { RichTextContent } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

const FALLBACK_TITLE = "A little corner for my characters, art, and side projects.";
const FALLBACK_TAGLINE =
  "I keep the things I care about here: character references, favorite art, and whatever I happen to be making.";

function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h2
          id={id}
          className="font-display text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-6xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-xl",
          )}
        >
          {linkLabel}
          <ArrowUpRightIcon data-icon="inline-end" />
        </Link>
      ) : null}
      <Separator className="lg:col-span-2" />
    </div>
  );
}

export default async function Home() {
  const [settings, projects, characters] = await Promise.all([
    getSiteSettings(),
    getProjects(),
    getCharacters(),
  ]);

  const featured = projects.filter((project) => project.featured);
  const shownProjects = featured.length > 0 ? featured : projects.slice(0, 6);
  const shownCharacters = characters.slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-28 px-4 pb-24 pt-4 sm:px-6 sm:pt-8 lg:px-8 lg:pb-32">
      <Bubble
        className="min-h-176 overflow-hidden rounded-[2rem] border border-border bg-card shadow-glow-lg"
        size={44}
        trail={18}
        follow={0.42}
        blend={13}
        refraction={54}
        dispersion={1.35}
        shine={0.48}
        rim={0.72}
        iridescence={0.8}
        intensity={0.75}
        tint={[0.36, 0.8, 1]}
        tintStrength={0.08}
        colorA={[0.23, 0.75, 0.98]}
        colorB={[0.35, 0.48, 0.96]}
        fallbackOpacity={0.6}
      >
        <section className="relative flex min-h-176 flex-col overflow-hidden p-6 sm:p-9 lg:p-12">
          <div className="absolute -right-40 -top-36 size-136 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-36 -left-24 size-112 rounded-full bg-signal/6 blur-3xl" />
          <div className="absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-background/20" />

          <div className="relative flex flex-1 items-center py-16">
            <div className="max-w-5xl">
              <p className="mb-5 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-primary">
                Hi, I&rsquo;m PlayWolf.
              </p>
              <BlurText
                text={settings.heroTitle ?? FALLBACK_TITLE}
                className="wrap-break-word font-display text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.84] tracking-[-0.075em] text-foreground"
              />
              <Reveal delay={0.2} distance={14}>
                <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {settings.heroTagline ?? FALLBACK_TAGLINE}
                </p>
              </Reveal>
            </div>
          </div>
          <Reveal className="relative" delay={0.32} distance={12}>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ref"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "rounded-xl",
                )}
              >
                Meet my characters
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/gallery"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-xl bg-background/55",
                )}
              >
                Look through my gallery
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </div>
          </Reveal>
        </section>
      </Bubble>

      <Reveal>
        <Canvas
          className="min-h-96 overflow-hidden rounded-[2rem] border border-border bg-card shadow-glow-md"
          threadSize={2.4}
          threadWidth={0.18}
          texture={0.72}
          tint={[0.36, 0.8, 1]}
          tintStrength={0.08}
          grain={0.34}
          halftone={0.08}
          dotSize={7}
          strength={0.62}
          relief={0.28}
          gloss={0.22}
          bristle={0.36}
          radius={0.1}
          intro={1.1}
        >
          <section className="grid min-h-96 gap-10 bg-card/85 p-7 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end lg:p-14">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-primary">
                About this place
              </p>
              <h2 className="mt-5 font-display text-5xl font-bold leading-[0.9] tracking-[-0.065em] sm:text-7xl">
                Made for fun, kept with care.
              </h2>
            </div>
            <div>
              {settings.about ? (
                <RichTextContent
                  className="max-w-2xl text-base leading-relaxed text-muted-foreground"
                  value={settings.about}
                />
              ) : (
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  I made this site to give my characters, commissioned pieces, sketches,
                  and experiments a home that feels like mine.
                </p>
              )}
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "mt-7 rounded-xl",
                )}
              >
                More about me
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </div>
          </section>
        </Canvas>
      </Reveal>

      <Reveal>
        <section aria-labelledby="work">
          <SectionHeading
            id="work"
            title="Things I&rsquo;m making"
            description="Small web experiments, useful tools, and ideas I&rsquo;m tinkering with."
            href="/projects"
            linkLabel="See all projects"
          />

          {shownProjects.length === 0 ? (
            <Empty className="mt-8 min-h-72 border bg-card/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PencilIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing here just yet</EmptyTitle>
                <EmptyDescription>
                  I&rsquo;ll add projects whenever they are ready to share.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/ref" className={buttonVariants({ variant: "outline" })}>
                  Browse references
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shownProjects.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} headingLevel={3} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      {shownCharacters.length > 0 ? (
        <Reveal>
          <section aria-labelledby="characters">
            <SectionHeading
              id="characters"
              title="My characters"
              description="The cast I keep coming back to, with references, details, and art collected for each of them."
              href="/ref"
              linkLabel="See everyone"
            />

            <Carousel opts={{ align: "start" }} className="mt-8">
              <CarouselContent>
                {shownCharacters.map((character) => (
                  <CarouselItem
                    key={character.slug}
                    className="basis-[86%] sm:basis-1/2 lg:basis-1/3"
                  >
                    <CharacterCard character={character} headingLevel={3} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {shownCharacters.length > 1 ? (
                <div className="mt-5 flex items-center gap-2">
                  <CarouselPrevious className="static translate-x-0 translate-y-0" />
                  <CarouselNext className="static translate-x-0 translate-y-0" />
                  <p className="ml-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Drag to meet more
                  </p>
                </div>
              ) : null}
            </Carousel>
          </section>
        </Reveal>
      ) : null}

      {settings.links.length > 0 ? (
        <Reveal>
          <section
            aria-labelledby="links"
            className="relative overflow-hidden rounded-[2rem] border border-border bg-card/82 p-7 shadow-glow-sm sm:p-10 lg:p-14"
          >
            <div className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/8 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-primary">
                  Elsewhere online
                </p>
                <h2
                  id="links"
                  className="mt-3 max-w-3xl font-display text-5xl font-bold leading-[0.9] tracking-[-0.07em] sm:text-7xl"
                >
                  Come say hi.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  A few other places where I post, chat, or share what I&rsquo;m working
                  on.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <LinkRow links={settings.links} />
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
