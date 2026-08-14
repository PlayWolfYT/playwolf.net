import type { ComponentProps, CSSProperties, ElementType } from "react";
import {
  Cloud,
  Code2,
  Dog,
  Gamepad2,
  Ghost,
  Heart,
  Moon,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { FaBone, FaPaw } from "react-icons/fa6";
import { IoMusicalNotes } from "react-icons/io5";
import { PiPawPrintFill } from "react-icons/pi";

type DecorItem = {
  Icon: ElementType;
  /** Position, size, rotation, colour/opacity, visibility, animation delay */
  cls: string;
  /** Extra props for the icon (strokeWidth/fill for the Lucide outlines) */
  props?: ComponentProps<"svg">;
};

const outline = { strokeWidth: 1.5 } as const;
const filledStar = { fill: "currentColor", strokeWidth: 0 } as const;

/**
 * Hand-placed anchor pieces: the paw trails, the night-sky cluster, and the
 * personality nods. Positions are viewport percentages (the parent layer is
 * fixed); `lg:`/`xl:` gates keep narrow screens uncluttered. Icons are mixed
 * from several sets: FontAwesome for the solid paws and bone, Phosphor for
 * the heel-pad paw prints, Ionicons for the music notes, Lucide for the
 * stroke-style rest.
 */
const items: DecorItem[] = [
  // FontAwesome solid paws wandering up the left gutter
  {
    Icon: FaPaw,
    cls: "left-[3%] top-[76%] h-9 w-9 rotate-[-24deg] text-glow-500/20 hidden lg:block",
  },
  {
    Icon: FaPaw,
    cls: "left-[6.5%] top-[64%] h-8 w-8 rotate-[-8deg] text-glow-500/20 hidden lg:block",
  },
  {
    Icon: FaPaw,
    cls: "left-[3.5%] top-[52%] h-9 w-9 rotate-[-26deg] text-glow-500/17 hidden lg:block",
  },
  {
    Icon: FaPaw,
    cls: "left-[7%] top-[40%] h-8 w-8 -rotate-6 text-glow-500/17 hidden lg:block",
  },
  {
    Icon: FaPaw,
    cls: "left-[4.5%] top-[28%] h-7 w-7 rotate-[-22deg] text-glow-500/15 hidden lg:block",
  },
  {
    Icon: FaPaw,
    cls: "left-[8%] top-[17%] h-6 w-6 rotate-[-4deg] text-glow-500/12 hidden xl:block",
  },

  // Phosphor paw prints (with heel pad) heading down the right gutter
  {
    Icon: PiPawPrintFill,
    cls: "right-[7%] top-[46%] h-8 w-8 rotate-152 text-glow-500/17 hidden lg:block",
  },
  {
    Icon: PiPawPrintFill,
    cls: "right-[4%] top-[58%] h-9 w-9 rotate-170 text-glow-500/20 hidden lg:block",
  },
  {
    Icon: PiPawPrintFill,
    cls: "right-[8%] top-[70%] h-9 w-9 rotate-150 text-glow-500/20 hidden lg:block",
  },
  {
    Icon: PiPawPrintFill,
    cls: "right-[5%] top-[82%] h-10 w-10 rotate-168 text-glow-500/20 hidden lg:block",
  },

  // Night-sky cluster, top right (Lucide strokes)
  {
    Icon: Moon,
    cls: "right-[5%] top-[11%] h-11 w-11 rotate-12 text-glow-500/30",
    props: outline,
  },
  {
    Icon: Sparkles,
    cls: "right-[10%] top-[18%] h-6 w-6 animate-twinkle text-glow-500/40",
    props: outline,
  },
  {
    Icon: Star,
    cls: "right-[3%] top-[23%] h-4 w-4 animate-twinkle text-glow-500/35 [animation-delay:900ms]",
    props: filledStar,
  },
  {
    Icon: Star,
    cls: "right-[13%] top-[9%] h-3 w-3 animate-twinkle text-glow-500/30 [animation-delay:1600ms] hidden lg:block",
    props: filledStar,
  },
  {
    Icon: Cloud,
    cls: "right-[17%] top-[14%] h-6 w-6 text-glow-500/17 hidden xl:block",
    props: outline,
  },

  // Personality nods, tucked into the corners
  {
    Icon: Code2,
    cls: "left-[12%] top-[8%] h-7 w-7 -rotate-6 text-glow-500/20 hidden lg:block",
    props: outline,
  },
  {
    Icon: Gamepad2,
    cls: "right-[15%] top-[88%] h-8 w-8 rotate-14 text-glow-500/25 hidden lg:block",
    props: outline,
  },
  {
    Icon: Zap,
    cls: "left-[17%] top-[13%] h-5 w-5 rotate-18 text-glow-500/25 hidden xl:block",
    props: outline,
  },
  {
    Icon: Dog,
    cls: "left-[18%] top-[80%] h-8 w-8 -rotate-6 text-glow-500/20 hidden xl:block",
    props: outline,
  },
  {
    Icon: Ghost,
    cls: "right-[20%] top-[27%] h-6 w-6 rotate-6 text-glow-500/17 hidden xl:block",
    props: outline,
  },

  // Scattered accents
  {
    Icon: Sparkles,
    cls: "left-[7%] top-[8%] h-7 w-7 animate-twinkle text-glow-500/35 [animation-delay:400ms]",
    props: outline,
  },
  {
    Icon: Star,
    cls: "left-[14%] top-[22%] h-3.5 w-3.5 animate-twinkle text-glow-500/30 [animation-delay:1400ms] hidden lg:block",
    props: filledStar,
  },
  {
    Icon: Heart,
    cls: "right-[12%] top-[33%] h-6 w-6 rotate-12 text-glow-500/25 hidden lg:block",
    props: outline,
  },
  {
    Icon: FaBone,
    cls: "left-[13%] top-[68%] h-7 w-7 rotate-[-20deg] text-glow-500/17 hidden xl:block",
  },
  {
    Icon: IoMusicalNotes,
    cls: "left-[10%] top-[88%] h-7 w-7 rotate-6 text-glow-500/20",
  },
  {
    Icon: Sparkles,
    cls: "right-[11%] top-[93%] h-6 w-6 animate-twinkle text-glow-500/35 [animation-delay:1800ms]",
    props: outline,
  },
  {
    Icon: Star,
    cls: "left-[5%] top-[92%] h-3.5 w-3.5 animate-twinkle text-glow-500/35 [animation-delay:600ms]",
    props: filledStar,
  },
  {
    Icon: Star,
    cls: "left-[20%] top-[94%] h-3 w-3 animate-twinkle text-glow-500/25 [animation-delay:2200ms] hidden lg:block",
    props: filledStar,
  },
  {
    Icon: Star,
    cls: "right-[19%] top-[6%] h-3 w-3 animate-twinkle text-glow-500/25 [animation-delay:1100ms] hidden lg:block",
    props: filledStar,
  },
  {
    Icon: Heart,
    cls: "left-[16%] top-[47%] h-4 w-4 rotate-[-14deg] text-glow-500/17 hidden xl:block",
    props: outline,
  },
  {
    Icon: Sparkles,
    cls: "right-[16%] top-[52%] h-5 w-5 animate-twinkle text-glow-500/25 [animation-delay:2600ms] hidden xl:block",
    props: outline,
  },
  {
    Icon: Star,
    cls: "right-[2%] top-[38%] h-3 w-3 animate-twinkle text-glow-500/30 [animation-delay:300ms]",
    props: filledStar,
  },
  {
    Icon: Star,
    cls: "left-[2%] top-[62%] h-3 w-3 animate-twinkle text-glow-500/30 [animation-delay:1900ms]",
    props: filledStar,
  },
];

/**
 * Deterministic PRNG (mulberry32). The scatter fields below are generated at
 * module scope from a fixed seed, so the server and client always render the
 * same layout — no hydration mismatch, no layout jumps.
 */
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

type FieldItem = {
  Icon: ElementType;
  style: CSSProperties;
  twinkle: boolean;
  desktopOnly: boolean;
  props?: ComponentProps<"svg">;
};

/** Icon palette for the generated scatter, weighted toward small stars. */
const fieldPalette: { Icon: ElementType; props?: ComponentProps<"svg"> }[] = [
  { Icon: Star, props: filledStar },
  { Icon: Star, props: filledStar },
  { Icon: Star, props: filledStar },
  { Icon: Sparkles, props: outline },
  { Icon: FaPaw },
  { Icon: PiPawPrintFill },
  { Icon: Heart, props: outline },
];

const rand = mulberry32(20260728);

/** ~48 small icons scattered through the side bands of the viewport. */
const field: FieldItem[] = Array.from({ length: 48 }, (_, index) => {
  const onLeft = rand() < 0.5;
  const x = onLeft ? 1 + rand() * 19 : 80 + rand() * 19;
  const y = 3 + rand() * 94;
  const size = 8 + Math.round(rand() * 16);
  const rotation = Math.round(-35 + rand() * 70);
  const opacity = 0.1 + rand() * 0.2;
  const pick = fieldPalette[Math.floor(rand() * fieldPalette.length)];

  return {
    Icon: pick.Icon,
    props: pick.props,
    twinkle: rand() < 0.45,
    desktopOnly: index % 3 !== 0,
    style: {
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      width: size,
      height: size,
      opacity,
      transform: `rotate(${rotation}deg)`,
      animationDelay: `${(rand() * 3).toFixed(2)}s`,
    },
  };
});

/** ~44 tiny "star dust" dots across the whole viewport, including the top
 *  and bottom strips behind the content column. */
const dust = Array.from({ length: 44 }, (_, index) => {
  const nearEdge = rand() < 0.7;
  const x = nearEdge
    ? rand() < 0.5
      ? rand() * 24
      : 76 + rand() * 24
    : 24 + rand() * 52;
  const y = nearEdge ? 2 + rand() * 96 : rand() < 0.5 ? rand() * 8 : 90 + rand() * 9;
  const size = 2 + Math.round(rand() * 2);

  return {
    twinkle: rand() < 0.5,
    desktopOnly: index % 4 !== 0,
    style: {
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      width: size,
      height: size,
      opacity: 0.15 + rand() * 0.25,
      animationDelay: `${(rand() * 3).toFixed(2)}s`,
    } satisfies CSSProperties,
  };
});

/**
 * Accent-tinted decorations layered over the brand backdrop on /ref pages.
 * Rendered inside the fixed, viewport-anchored backdrop layer, so positions
 * are relative to the screen (not the page) and never shift when the page
 * height changes, e.g. when switching profiles. Everything uses the `glow-*`
 * tokens and re-themes with the active character profile.
 */
export function BackdropDecor() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* Star-dust dots */}
      {dust.map((dot, index) => (
        <span
          key={`dust-${index}`}
          className={`absolute rounded-full bg-glow-500 ${
            dot.twinkle ? "animate-twinkle" : ""
          } ${dot.desktopOnly ? "hidden lg:block" : ""}`}
          style={dot.style}
        />
      ))}

      {/* Generated icon scatter in the side bands */}
      {field.map(({ Icon, style, twinkle, desktopOnly, props }, index) => (
        <Icon
          key={`field-${index}`}
          className={`absolute text-glow-500 ${twinkle ? "animate-twinkle" : ""} ${
            desktopOnly ? "hidden lg:block" : ""
          }`}
          style={style}
          {...props}
        />
      ))}

      {/* Hand-placed anchor pieces */}
      {items.map(({ Icon, cls, props }, index) => (
        <Icon key={`item-${index}`} className={`absolute ${cls}`} {...props} />
      ))}

      {/* Thin accent rings, partially offscreen for depth */}
      <div className="absolute -left-24 top-[6%] hidden h-72 w-72 rounded-full border border-glow-500/15 lg:block" />
      <div className="absolute -right-32 top-[44%] hidden h-96 w-96 rounded-full border border-glow-500/10 lg:block" />
      <div className="absolute -bottom-24 right-[20%] h-56 w-56 rounded-full border border-glow-500/12" />
      <div className="absolute -left-16 bottom-[4%] hidden h-64 w-64 rounded-full border border-glow-500/10 xl:block" />
      <div className="absolute right-[9%] top-[62%] hidden h-40 w-40 rounded-full border border-glow-500/8 xl:block" />

      {/* Extra drifting glows */}
      <div className="absolute -left-20 top-[58%] hidden h-80 w-80 rounded-full bg-glow-500/15 blur-[110px] animate-drift [animation-delay:4s] lg:block" />
      <div className="absolute -right-24 top-[16%] hidden h-72 w-72 rounded-full bg-glow-500/10 blur-[100px] animate-drift [animation-delay:9s] lg:block" />
    </div>
  );
}
