import { ArrowRightIcon, ArrowUpRightIcon, ArchiveIcon } from "lucide-react";
import Link from "next/link";

import { Bubble } from "@/components/canvasui/Bubble";
import { Canvas } from "@/components/canvasui/Canvas";
import { BlurText } from "@/components/motion/BlurText";
import { Reveal } from "@/components/motion/Reveal";
import { CharacterCard } from "@/components/ref/CharacterCard";
import { LinkRow } from "@/components/site/LinkRow";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Badge } from "@/components/ui/badge";
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

const FALLBACK_TITLE = "A living archive for characters with bite.";
const FALLBACK_TAGLINE =
  "Reference sheets, commissioned artwork, and small digital worlds—collected in one place.";

function SectionHeading({
  index,
  title,
  description,
  href,
  linkLabel,
}: {
  index: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-primary">
          {index} / archive
        </p>
        <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-6xl">
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
        className="min-h-[44rem] overflow-hidden rounded-[2rem] border border-border bg-card shadow-glow-lg"
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
        tint={[1, 0.42, 0.24]}
        tintStrength={0.08}
        colorA={[1, 0.26, 0.12]}
        colorB={[0.62, 0.82, 0.18]}
        fallbackOpacity={0.6}
      >
        <section className="relative flex min-h-[44rem] flex-col overflow-hidden p-6 sm:p-9 lg:p-12">
          <div className="absolute inset-0 bg-grid-soft bg-size-[58px_58px] opacity-55" />
          <div className="absolute -right-32 -top-32 size-[32rem] rounded-full border border-primary/25" />
          <div className="absolute -right-16 -top-14 size-[22rem] rounded-full border border-dashed border-secondary/20" />
          <div className="absolute bottom-0 right-0 h-1/3 w-2/3 bg-linear-to-tl from-primary/12 to-transparent" />

          <div className="relative flex items-start justify-between gap-5">
            <Badge variant="secondary">Independent visual archive</Badge>
            <p className="hidden font-mono text-[0.58rem] uppercase tracking-[0.25em] text-muted-foreground sm:block">
              Est. online / 2026
            </p>
          </div>

          <div className="relative mt-auto grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="mb-5 font-mono text-[0.62rem] uppercase tracking-[0.28em] text-primary">
                playwolf.net
              </p>
              <BlurText
                text={settings.heroTitle ?? FALLBACK_TITLE}
                className="max-w-5xl wrap-break-word font-display text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.84] tracking-[-0.075em] text-foreground"
              />
              <Reveal delay={0.2} distance={14}>
                <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {settings.heroTagline ?? FALLBACK_TAGLINE}
                </p>
              </Reveal>
              <Reveal delay={0.32} distance={12}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/ref"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "rounded-xl",
                    )}
                  >
                    Browse characters
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                  <Link
                    href="/gallery"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-xl bg-background/55",
                    )}
                  >
                    Open gallery
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </div>
              </Reveal>
            </div>

            <aside className="rounded-2xl border border-border bg-background/72 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Archive pulse
                </p>
                <span className="flex items-center gap-2 text-xs text-signal">
                  <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                  Online
                </span>
              </div>
              <Separator className="my-4" />
              <dl className="grid grid-cols-2 gap-5">
                <div>
                  <dt className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Characters
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold tracking-[-0.06em]">
                    {characters.length.toString().padStart(2, "0")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Projects
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold tracking-[-0.06em]">
                    {projects.length.toString().padStart(2, "0")}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>
      </Bubble>

      <Reveal>
        <Canvas
          className="min-h-[24rem] overflow-hidden rounded-[2rem] border border-border bg-card shadow-glow-md"
          threadSize={2.4}
          threadWidth={0.18}
          texture={0.72}
          tint={[1, 0.48, 0.3]}
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
          <section className="grid min-h-[24rem] gap-10 bg-card/85 p-7 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end lg:p-14">
            <div>
              <Badge variant="outline">Studio note</Badge>
              <h2 className="mt-5 font-display text-5xl font-bold leading-[0.9] tracking-[-0.065em] sm:text-7xl">
                Art should feel alive.
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
                  This is a home for character design that deserves room to
                  breathe—reference sheets, commissioned work, sketches, and experiments
                  presented without a feed deciding what comes next.
                </p>
              )}
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "mt-7 rounded-xl",
                )}
              >
                Read the full note
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </div>
          </section>
        </Canvas>
      </Reveal>

      <Reveal>
        <section aria-labelledby="work">
          <SectionHeading
            index="01"
            title="Selected work"
            description="Web experiments, tools, and ideas at every stage—from rough signal to finished release."
            href="/projects"
            linkLabel="All projects"
          />

          {shownProjects.length === 0 ? (
            <Empty className="mt-8 min-h-72 border bg-card/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArchiveIcon />
                </EmptyMedia>
                <EmptyTitle>Fresh pages are still drying</EmptyTitle>
                <EmptyDescription>
                  Projects will land here as soon as they are ready to leave the studio.
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
                  <ProjectCard project={project} />
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
              index="02"
              title="Meet the cast"
              description="Reference-ready profiles, palettes, details, and commissioned pieces for every character."
              href="/ref"
              linkLabel="Character index"
            />

            <Carousel opts={{ align: "start" }} className="mt-8">
              <CarouselContent>
                {shownCharacters.map((character) => (
                  <CarouselItem
                    key={character.slug}
                    className="basis-[86%] sm:basis-1/2 lg:basis-1/3"
                  >
                    <CharacterCard character={character} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {shownCharacters.length > 1 ? (
                <div className="mt-5 flex items-center gap-2">
                  <CarouselPrevious className="static translate-x-0 translate-y-0" />
                  <CarouselNext className="static translate-x-0 translate-y-0" />
                  <p className="ml-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Drag to explore
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
            className="relative overflow-hidden rounded-[2rem] bg-secondary p-7 text-secondary-foreground sm:p-10 lg:p-14"
          >
            <div className="absolute -right-20 -top-24 size-72 rounded-full border border-secondary-foreground/15" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] opacity-60">
                  03 / outbound signal
                </p>
                <h2
                  id="links"
                  className="mt-3 max-w-3xl font-display text-5xl font-bold leading-[0.9] tracking-[-0.07em] sm:text-7xl"
                >
                  Find me beyond the archive.
                </h2>
              </div>
              <div className="rounded-2xl bg-secondary-foreground p-4 text-secondary">
                <LinkRow links={settings.links} />
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
