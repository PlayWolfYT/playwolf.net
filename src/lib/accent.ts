/**
 * Pure, client-safe helpers turning one accent hex into the five-step CSS
 * variable ramp the Tailwind `glow` palette reads from (see the `@theme` block
 * in `globals.css`).
 *
 * Values are "R G B" space-separated triplets so Tailwind can recompose them
 * with per-utility alpha: `rgb(var(--accent-500) / <alpha-value>)`.
 *
 * The white/black mix ratios approximate the lightness spread of the original
 * cyan ramp (#8ad9ff / #5cccff / #3abef9 / #1aa6eb / #0b7dbd) relative to its
 * #3abef9 midpoint.
 *
 * Every step is additionally held to a WCAG contrast floor against the void
 * backdrop, because the accent is operator-chosen per character profile — a
 * deep navy or burgundy would otherwise leave chip labels and eyebrow copy
 * unreadable on a near-black stage.
 */

export type AccentVars = {
  "--accent-300": string;
  "--accent-400": string;
  "--accent-500": string;
  "--accent-600": string;
  "--accent-700": string;
};

export type ProfileThemeVars = AccentVars & {
  "--color-glow-300": string;
  "--color-glow-400": string;
  "--color-glow-500": string;
  "--color-glow-600": string;
  "--color-glow-700": string;
  "--primary": string;
  "--secondary": string;
  "--accent": string;
  "--border": string;
  "--input": string;
  "--ring": string;
  "--chart-1": string;
  "--chart-2": string;
  "--sidebar-primary": string;
  "--sidebar-accent": string;
  "--sidebar-border": string;
  "--sidebar-ring": string;
  "--shadow-glow-sm": string;
  "--shadow-glow-md": string;
  "--shadow-glow-lg": string;
  "--shadow-inner-glow": string;
  "--background-image-rim-cyan": string;
  "--background-image-shimmer": string;
};

export type Rgb = [number, number, number];

/** `--color-void` from `globals.css`; the page background every step sits on. */
export const VOID_RGB: Rgb = [13, 12, 11];

/** `VOID_RGB` as the hex the operator sees in the CMS validation message. */
const VOID_HEX = `#${VOID_RGB.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;

/**
 * WCAG 1.4.3 for normal-size text. Steps 300–500 all appear as `text-glow-*`
 * at 14px or smaller (chips, counters, the site-header wordmark).
 */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * WCAG 1.4.11 for non-text contrast. Steps 600–700 are only ever borders,
 * shadows and gradient stops, so they get the lower floor.
 */
export const MIN_UI_CONTRAST = 3;

const HEX_PATTERN = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

/** Mix `amount` (0..1) of `target` into `base`, per channel. */
function mix(base: Rgb, target: number, amount: number): Rgb {
  return base.map((channel) =>
    Math.round(channel + (target - channel) * amount),
  ) as Rgb;
}

function triplet([r, g, b]: Rgb): string {
  return `${r} ${g} ${b}`;
}

function channelLuminance(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.x contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Each ramp step as a mix off the base, plus the floor it has to clear. */
const RAMP: readonly {
  key: keyof AccentVars;
  target: number;
  amount: number;
  min: number;
}[] = [
  { key: "--accent-300", target: 255, amount: 0.4, min: MIN_TEXT_CONTRAST },
  { key: "--accent-400", target: 255, amount: 0.2, min: MIN_TEXT_CONTRAST },
  { key: "--accent-500", target: 255, amount: 0, min: MIN_TEXT_CONTRAST },
  { key: "--accent-600", target: 0, amount: 0.14, min: MIN_UI_CONTRAST },
  { key: "--accent-700", target: 0, amount: 0.32, min: MIN_UI_CONTRAST },
];

/** 1% granularity is finer than the eye reads and settles in a few steps. */
const LIFT_STEPS = 100;

function clearsFloors(base: Rgb): boolean {
  return RAMP.every(
    (step) => contrastRatio(mix(base, step.target, step.amount), VOID_RGB) >= step.min,
  );
}

/**
 * Blend white into the base until every step clears its floor. Lifting the
 * steps individually would invert the ramp — a lifted 700 can overshoot past
 * 600 — so the whole ramp moves together and keeps its shape. White is the
 * same lever the lighter steps already use, so the hue survives and only
 * saturation is lost.
 */
function liftBase(base: Rgb): Rgb {
  if (clearsFloors(base)) return base;

  for (let step = 1; step <= LIFT_STEPS; step += 1) {
    const candidate = mix(base, 255, step / LIFT_STEPS);
    if (clearsFloors(candidate)) return candidate;
  }
  return [255, 255, 255];
}

/** Build the accent CSS-variable ramp for one hex colour. */
export function accentVars(hex: string): AccentVars {
  const base = liftBase(hexToRgb(hex));
  return Object.fromEntries(
    RAMP.map((step) => [step.key, triplet(mix(base, step.target, step.amount))]),
  ) as AccentVars;
}

/**
 * `validate` for the CMS accent field. The ramp silently lifts anything below
 * the text floor, so the only hard stop is a colour so dark that even borders
 * would fail — at that point what renders is nowhere near what was picked.
 */
export function validateAccentColor(value?: string | null): true | string {
  if (!value) return true;
  if (!HEX_PATTERN.test(value)) return "Enter a hex colour such as #3abef9.";

  const ratio = contrastRatio(hexToRgb(value), VOID_RGB);
  if (ratio < MIN_UI_CONTRAST) {
    return `Too dark for the near-black stage: ${ratio.toFixed(1)}:1 against ${VOID_HEX}, ${MIN_UI_CONTRAST}:1 is the minimum. Pick a lighter shade.`;
  }
  return true;
}

/**
 * Complete profile theme override.
 *
 * Tailwind theme tokens such as `--color-glow-500` and shadcn semantic tokens
 * such as `--primary` are declared on `:root`. Merely overriding the
 * `--accent-*` inputs on a descendant does not reliably re-resolve those
 * inherited custom properties, leaving utilities and buttons on the root blue.
 * Override every derived token at the profile boundary so all consumers use
 * the active profile ramp.
 */
export function profileThemeVars(hex: string): ProfileThemeVars {
  const ramp = accentVars(hex);
  const color = (step: keyof AccentVars, alpha?: number) =>
    `rgb(${ramp[step]}${alpha === undefined ? "" : ` / ${alpha}`})`;

  return {
    ...ramp,
    "--color-glow-300": color("--accent-300"),
    "--color-glow-400": color("--accent-400"),
    "--color-glow-500": color("--accent-500"),
    "--color-glow-600": color("--accent-600"),
    "--color-glow-700": color("--accent-700"),
    "--primary": color("--accent-500"),
    "--secondary": color("--accent-300"),
    "--accent": color("--accent-700", 0.38),
    "--border": color("--accent-400", 0.2),
    "--input": color("--accent-400", 0.26),
    "--ring": color("--accent-400"),
    "--chart-1": color("--accent-500"),
    "--chart-2": color("--accent-300"),
    "--sidebar-primary": color("--accent-500"),
    "--sidebar-accent": color("--accent-700", 0.38),
    "--sidebar-border": color("--accent-400", 0.2),
    "--sidebar-ring": color("--accent-400"),
    "--shadow-glow-sm": `0 1px 0 rgb(255 255 255 / 0.06), 0 14px 34px rgb(0 0 0 / 0.24), 0 0 26px -16px ${color("--accent-500", 0.72)}`,
    "--shadow-glow-md": `0 1px 0 rgb(255 255 255 / 0.07), 0 24px 70px rgb(0 0 0 / 0.38), 0 0 0 1px ${color("--accent-500", 0.14)}, 0 0 42px -24px ${color("--accent-500", 0.72)}`,
    "--shadow-glow-lg": `0 1px 0 rgb(255 255 255 / 0.08), 0 36px 110px rgb(0 0 0 / 0.5), 0 0 60px -20px ${color("--accent-500", 0.38)}`,
    "--shadow-inner-glow": `inset 0 1px 0 rgb(255 255 255 / 0.07), inset 0 0 0 1px ${color("--accent-500", 0.1)}`,
    "--background-image-rim-cyan": `radial-gradient(ellipse 70% 48% at 50% -16%, ${color("--accent-500", 0.2)}, transparent 62%)`,
    "--background-image-shimmer": `linear-gradient(105deg, transparent 40%, ${color("--accent-400", 0.14)} 50%, transparent 60%)`,
  };
}
