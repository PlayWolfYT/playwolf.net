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
