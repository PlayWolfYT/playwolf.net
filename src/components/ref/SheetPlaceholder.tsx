import type { ComponentType, CSSProperties } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { SparkStar } from "@/components/BrandBackdrop";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { WipQuoteCycler } from "@/components/ref/WipQuoteCycler";
import { WipTape } from "@/components/ref/WipTape";
import { hexToRgb, type Rgb } from "@/lib/accent";
import type { RefSheetWip, WipIconName } from "@/lib/content";

type SheetPlaceholderProps = {
  sheet: RefSheetWip;
};

type IconComponent = ComponentType<{
  className?: string;
  strokeWidth?: number | string;
}>;

/**
 * Resolves the picked icon names to components here on the server rather than
 * with lucide's `DynamicIcon`, which loads in an effect — the whole backdrop
 * would pop in after hydration. Only the handful of distinct names a sheet
 * actually uses gets imported.
 */
async function loadIcons(names: WipIconName[]): Promise<Record<string, IconComponent>> {
  const imports = dynamicIconImports as Record<
    string,
    (() => Promise<{ default: IconComponent }>) | undefined
  >;

  const entries = await Promise.all(
    [...new Set(names)].map(async (name) => {
      const load = imports[name];
      if (!load) return null;
      return [name, (await load()).default] as const;
    }),
  );

  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

/** Deterministic PRNG (mulberry32) — same scatter on server and client. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a — seeds the scatter from the sheet title so each sheet differs. */
function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Sample a colour list as one continuous ramp at `t` (0..1). */
function sampleGradient(stops: Rgb[], t: number): Rgb {
  if (stops.length === 1) return stops[0];
  const scaled = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const ratio = scaled - index;
  const from = stops[index];
  const to = stops[index + 1];
  return [0, 1, 2].map((channel) =>
    Math.round(from[channel] + (to[channel] - from[channel]) * ratio),
  ) as Rgb;
}

type Speck = { name: WipIconName; style: CSSProperties; twinkle: boolean };
type Dust = { style: CSSProperties; twinkle: boolean };

/**
 * Glyph and dust sizes are percentages of the frame's own width (paired with
 * `aspect-ratio: 1`), so the scatter scales with the rendered element instead
 * of being pinned to pixel sizes.
 */
const ICON_MIN_PCT = 2.6;
const ICON_MAX_PCT = 6.4;
const DUST_MIN_PCT = 0.45;
const DUST_MAX_PCT = 1;

/** Keeps the scatter clear of the double frame (`inset-3` + dashed `1.15rem`). */
const EDGE_REM = 2;

/** Signed calc term, skipped when it rounds to zero. */
function term(value: number, unit: string) {
  const rounded = Number(value.toFixed(3));
  if (rounded === 0) return "";
  return `${rounded < 0 ? " - " : " + "}${Math.abs(rounded)}${unit}`;
}

/**
 * Map `t` (0..1) onto one axis of the safe band: the glyph centre is inset by
 * the frame margin plus its own half-size, so `t = 0` / `t = 1` land the glyph
 * flush against the band edge without ever crossing the border.
 */
function axis(t: number, halfPercent: number) {
  const percent = t * 100 + (1 - 2 * t) * halfPercent;
  return `calc(${percent.toFixed(3)}%${term((1 - 2 * t) * EDGE_REM, "rem")})`;
}

/**
 * Jittered grid: one slot per cell, shuffled so the gaps land at random spots
 * instead of trailing off at the end. Even coverage of the whole frame without
 * the clumps and bald patches pure random sampling produces.
 */
function scatterSlots(count: number, ratio: number, random: () => number) {
  const columns = Math.max(1, Math.round(Math.sqrt(count * ratio)));
  const rows = Math.max(1, Math.ceil(count / columns));

  const slots = Array.from({ length: columns * rows }, (_, index) => ({
    x: ((index % columns) + 0.12 + random() * 0.76) / columns,
    y: (Math.floor(index / columns) + 0.12 + random() * 0.76) / rows,
  }));

  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  return slots.slice(0, count);
}

/**
 * Stand-in for a reference sheet that doesn't exist yet: a framed stage with
 * the character's own icons scattered across the backdrop and status quotes
 * fading between random picks.
 *
 * Driven entirely by `sheet.wip`: `icons` (components imported straight from
 * `lucide-react` / `react-icons`), `iconCount`, `gradient` (hex list blended
 * across the frame to tint the scatter and title), `badge`, `subtitle`,
 * `quotes`, `interval` and `aspect`. Without a `gradient` the scatter follows
 * the active profile accent.
 */
export async function SheetPlaceholder({ sheet }: SheetPlaceholderProps) {
  const { badge, subtitle, quotes, icons, iconCount, gradient, interval, aspect } =
    sheet.wip;

  const iconComponents = await loadIcons(icons);
  const usable = icons.filter((name) => name in iconComponents);

  const stops = gradient.map(hexToRgb);
  const tinted = stops.length > 0;
  const colourAt = tinted
    ? (x: number, y: number) => {
        const [r, g, b] = sampleGradient(stops, (x / 100) * 0.7 + (y / 100) * 0.3);
        return `rgb(${r} ${g} ${b})`;
      }
    : undefined;

  const random = mulberry32(hashString(sheet.title) + iconCount * 2654435761);

  // Width-relative sizes need the frame ratio to convert a glyph's height into
  // a percentage of the frame height for the vertical margin.
  const [frameWidth, frameHeight] = aspect.split("/").map(Number);
  const ratio = frameWidth / frameHeight;

  const specks: Speck[] = scatterSlots(
    usable.length > 0 ? iconCount : 0,
    ratio,
    random,
  ).map(({ x, y }) => {
    const size = ICON_MIN_PCT + random() * (ICON_MAX_PCT - ICON_MIN_PCT);

    return {
      name: usable[Math.floor(random() * usable.length)],
      twinkle: random() < 0.4,
      style: {
        left: axis(x, size / 2),
        top: axis(y, (size / 2) * ratio),
        width: `${size.toFixed(3)}%`,
        aspectRatio: "1",
        opacity: 0.16 + random() * 0.28,
        color: colourAt?.(x * 100, y * 100),
        transform: `translate(-50%, -50%) rotate(${Math.round(-32 + random() * 64)}deg)`,
        animationDelay: `${(random() * 3).toFixed(2)}s`,
      },
    };
  });

  const dust: Dust[] = scatterSlots(34, ratio, random).map(({ x, y }) => {
    const size = DUST_MIN_PCT + random() * (DUST_MAX_PCT - DUST_MIN_PCT);

    return {
      twinkle: random() < 0.55,
      style: {
        left: axis(x, size / 2),
        top: axis(y, (size / 2) * ratio),
        width: `${size.toFixed(3)}%`,
        aspectRatio: "1",
        opacity: 0.18 + random() * 0.3,
        backgroundColor: colourAt?.(x * 100, y * 100),
        transform: "translate(-50%, -50%)",
        animationDelay: `${(random() * 3).toFixed(2)}s`,
      },
    };
  });

  const washStyle: CSSProperties | undefined = tinted
    ? { backgroundImage: `linear-gradient(115deg, ${gradient.join(", ")})` }
    : undefined;
  const titleStyle: CSSProperties | undefined = tinted
    ? { backgroundImage: `linear-gradient(90deg, ${gradient.join(", ")})` }
    : undefined;

  // Aspect ratio is locked from `sm` up. On mobile the frame sizes to its
  // content instead — a wide ratio like 16/9 as a grid spacer was expanding
  // the min-content width past the viewport.
  const frameStyle = {
    "--wip-aspect": `${frameWidth} / ${frameHeight}`,
  } as CSSProperties;

  return (
    <figure className="mx-auto w-full min-w-0 max-w-4xl">
      <div className="group rounded-3xl bg-gradient-to-br from-glow-500/45 via-white/[0.07] to-glow-700/30 p-px shadow-glow-md transition hover:from-glow-500/55">
        <div className="overflow-hidden rounded-[calc(1.5rem-1px)] bg-void">
          <div
            className="relative w-full min-w-0 overflow-hidden sm:[aspect-ratio:var(--wip-aspect)]"
            style={frameStyle}
          >
            <div className="relative flex w-full min-w-0 flex-col items-center px-6 pb-10 pt-14 sm:absolute sm:inset-0 sm:px-10 sm:py-14">
              {sheet.kind === "wip" ? (
                <div className="pointer-events-none absolute inset-0 z-20 origin-center transition duration-500 group-hover:scale-[1.02]">
                  <WipTape />
                </div>
              ) : null}
              {/* Stage atmosphere */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-void-lift via-void-panel to-void"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[size:34px_34px] bg-grid-soft opacity-70 [mask-image:radial-gradient(ellipse_at_center,transparent_12%,black_72%)]"
                aria-hidden
              />
              {washStyle ? (
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={washStyle}
                  aria-hidden
                />
              ) : (
                <div
                  className="pointer-events-none absolute inset-0 bg-rim-cyan"
                  aria-hidden
                />
              )}

              {/* Icon scatter — faded toward the centre so the copy stays legible */}
              <div
                className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_58%_62%_at_center,transparent_25%,black_82%)]"
                aria-hidden
              >
                {dust.map((dot, position) => (
                  <span
                    key={`dust-${position}`}
                    className={`absolute rounded-full ${tinted ? "" : "bg-glow-500"} ${
                      dot.twinkle ? "animate-twinkle" : ""
                    }`}
                    style={dot.style}
                  />
                ))}

                {specks.map(({ name, style, twinkle }, position) => {
                  const Icon = iconComponents[name];
                  return (
                    <span
                      key={`speck-${position}`}
                      className={`absolute block ${tinted ? "" : "text-glow-500"} ${
                        twinkle ? "animate-twinkle" : ""
                      }`}
                      style={style}
                    >
                      <Icon className="h-full w-full" strokeWidth={1.5} />
                    </span>
                  );
                })}
              </div>

              {/* Soft pool behind the copy */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-void/70 blur-3xl"
                aria-hidden
              />

              {/* Slow sheen sweeping across the frame */}
              <span
                className="pointer-events-none absolute inset-0 bg-shimmer animate-shimmer [animation-duration:7s]"
                aria-hidden
              />

              {/* Double frame + corner brackets */}
              <span
                className="pointer-events-none absolute inset-3 rounded-[1.35rem] border border-glow-500/20"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-[1.15rem] rounded-2xl border border-dashed border-white/[0.06]"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute left-3 top-3 h-7 w-7 rounded-tl-[1.35rem] border-l-2 border-t-2 border-glow-400/50"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute right-3 top-3 h-7 w-7 rounded-tr-[1.35rem] border-r-2 border-t-2 border-glow-400/50"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute bottom-3 left-3 h-7 w-7 rounded-bl-[1.35rem] border-b-2 border-l-2 border-glow-400/50"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 rounded-br-[1.35rem] border-b-2 border-r-2 border-glow-400/50"
                aria-hidden
              />

              {/* Badge tab hanging from the top edge */}
              <span className="absolute left-1/2 top-0 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border-x border-b border-glow-500/30 bg-void/85 px-4 py-1.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.28em] text-glow-300 backdrop-blur">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-glow-400 animate-slow-pulse"
                  aria-hidden
                />
                {badge}
              </span>

              {/* Content column — w-full so text-center is relative to the frame;
                  min-h-full + justify-center vertically centres copy inside the
                  locked aspect box from sm up. */}
              <div className="relative z-10 flex w-full min-h-full flex-col items-center justify-center text-center">
                <h2
                  className={`w-full break-words bg-clip-text font-display text-2xl font-medium tracking-tight text-transparent sm:text-3xl ${
                    tinted
                      ? ""
                      : "bg-gradient-to-r from-parchment via-glow-300 to-parchment"
                  }`}
                  style={titleStyle}
                >
                  {sheet.title}
                </h2>

                <div
                  className="mt-4 flex items-center justify-center gap-3"
                  aria-hidden
                >
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-glow-500/50 sm:w-16" />
                  <SparkStar className="h-3 w-3 animate-twinkle text-glow-400/80" />
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-glow-500/50 sm:w-16" />
                </div>

                <p className="mt-5 w-full font-mono text-[0.62rem] uppercase tracking-[0.24em] text-parchment-dim">
                  {subtitle}
                </p>

                <div className="mt-5 flex w-full flex-col items-center">
                  <WipQuoteCycler quotes={quotes} interval={interval} />
                </div>
              </div>
            </div>
          </div>

          {sheet.artist ? (
            <figcaption>
              <ArtistBar artist={sheet.artist} />
            </figcaption>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
