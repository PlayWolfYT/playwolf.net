import Link from "next/link";

import { SparkStar } from "@/components/BrandBackdrop";
import { BlurText } from "@/components/motion/BlurText";
import { Reveal } from "@/components/motion/Reveal";
import { CharacterCard } from "@/components/ref/CharacterCard";
import { LinkRow } from "@/components/site/LinkRow";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getCharacters, getProjects, getSiteSettings } from "@/lib/references";
import { RichTextContent } from "@/lib/rich-text";

/** Landing copy lives in `siteSettings`, but the page must stand up without it. */
const FALLBACK_TITLE = "Something fun is on the way";
const FALLBACK_TAGLINE =
  "Character references now, a fuller portfolio soon. Have a look around.";

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="font-display text-2xl font-light tracking-tight text-parchment sm:text-3xl"
    >
      {children}
    </h2>
  );
}

export default async function Home() {
  const [settings, projects, characters] = await Promise.all([
    getSiteSettings(),
    getProjects(),
    getCharacters(),
  ]);

  const featured = projects.filter((project) => project.featured);
  const shown = featured.length > 0 ? featured : projects.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      {/* Hero */}
      <section className="text-center">
        <div className="mb-8 flex justify-center gap-4 text-glow-500/40" aria-hidden>
          <SparkStar className="h-4 w-4 animate-twinkle" />
          <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
          <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
        </div>

        <p className="font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500">
          playwolf.net
        </p>

        <BlurText
          text={settings.heroTitle ?? FALLBACK_TITLE}
          className="mx-auto mt-6 max-w-3xl font-display text-4xl font-light leading-tight tracking-tight text-parchment sm:text-5xl"
        />

        <Reveal delay={0.25} distance={14}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-parchment-muted">
            {settings.heroTagline ?? FALLBACK_TAGLINE}
          </p>
        </Reveal>

        <Reveal delay={0.38} distance={12}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/ref"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:border-glow-500/60 hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
            >
              Browse references
            </Link>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
            >
              See projects
            </Link>
          </div>
        </Reveal>
      </section>

      {settings.about ? (
        <Reveal>
          <section aria-labelledby="about" className="mt-28">
            <SectionHeading id="about">About</SectionHeading>
            <div className="mt-6 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 px-6 py-6 shadow-glow-sm backdrop-blur-xl sm:px-8 sm:py-8">
              <RichTextContent
                className="max-w-2xl text-sm leading-relaxed text-parchment-muted"
                value={settings.about}
              />
            </div>
          </section>
        </Reveal>
      ) : null}

      {/* Work */}
      <Reveal>
        <section aria-labelledby="work" className="mt-28">
          <div className="flex items-baseline justify-between gap-4">
            <SectionHeading id="work">Work</SectionHeading>
            {projects.length > 0 ? (
              <Link
                href="/projects"
                className="text-xs font-medium uppercase tracking-[0.2em] text-parchment-dim transition hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
              >
                All projects
              </Link>
            ) : null}
          </div>

          {shown.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/[0.1] bg-void-lift/40 px-8 py-16 text-center">
              <p className="font-display text-lg font-medium text-parchment">
                Coming soon
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-parchment-muted">
                Projects will show up here as they are ready.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      {/* Characters */}
      {characters.length > 0 ? (
        <Reveal>
          <section aria-labelledby="characters" className="mt-28">
            <div className="flex items-baseline justify-between gap-4">
              <SectionHeading id="characters">Characters</SectionHeading>
              <Link
                href="/ref"
                className="text-xs font-medium uppercase tracking-[0.2em] text-parchment-dim transition hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
              >
                All references
              </Link>
            </div>

            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {characters.slice(0, 3).map((character) => (
                <li key={character.slug}>
                  <CharacterCard character={character} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ) : null}

      {settings.links.length > 0 ? (
        <Reveal>
          <section aria-labelledby="links" className="mt-28 text-center">
            <SectionHeading id="links">Elsewhere</SectionHeading>
            <LinkRow className="mt-6" links={settings.links} />
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
