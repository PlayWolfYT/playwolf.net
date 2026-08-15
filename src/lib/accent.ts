/**
 * Pure, client-safe helpers turning one accent hex into the five-step CSS
 * variable ramp the Tailwind `glow` palette reads from (see
 * `tailwind.config.ts` / `globals.css`).
 *
 * Values are "R G B" space-separated triplets so Tailwind can recompose them
 * with per-utility alpha: `rgb(var(--accent-500) / <alpha-value>)`.
 *
 * The white/black mix ratios approximate the lightness spread of the original
 * cyan ramp (#8ad9ff / #5cccff / #3abef9 / #1aa6eb / #0b7dbd) relative to its
 * #3abef9 midpoint.
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

/** Build the accent CSS-variable ramp for one hex colour. */
export function accentVars(hex: string): AccentVars {
  const base = hexToRgb(hex);
  return {
    "--accent-300": triplet(mix(base, 255, 0.4)),
    "--accent-400": triplet(mix(base, 255, 0.2)),
    "--accent-500": triplet(base),
    "--accent-600": triplet(mix(base, 0, 0.14)),
    "--accent-700": triplet(mix(base, 0, 0.32)),
  };
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
