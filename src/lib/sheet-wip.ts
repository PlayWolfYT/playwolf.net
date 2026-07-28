import type { StaticImageData } from "next/image";
import {
  Compass,
  Eraser,
  Paintbrush,
  Palette,
  Pencil,
  Ruler,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  RefSheet,
  RefSheetImage,
  RefSheetWip,
  WipIcon,
} from "@/data/types";

/** Built-in quote pool used when a WIP sheet omits `quotes`. */
export const DEFAULT_WIP_QUOTES = [
  "Something spicy is coming up",
  "Sharpening pencils",
  "Getting the drawing tablet",
  "Lines still warming up",
  "Pose practice in session",
  "Ink's not dry yet",
  "Sketching the good angles",
  "Almost ready to reveal",
  "More work to do",
  "Still cooking",
  "Soon™",
  "Coming soon",
  "Just a few more tweaks",
  "Finding the right brush size",
  "Brushing out the fur",
  "Untangling the tail",
  "Prepping the digital canvas",
  "Polishing the claws",
  "Checking the character palette",
  "Tail fluff loading",
  "Sketching out the beans",
  "Tracing the snout",
  "Adding extra fluff",
  "Fitting the outfit",
  "Applying final touches"
] as const;

export const NSFW_WIP_QUOTES = [
  "Unbuttoning the pants",
  "Undressing the ref",
  "Pulling down the shorts",
  "Dropping the clothes",
  "Slipping out of the outfit",
  "Removing the clothes layer",
  "Dimming the studio lights",
  "Putting on the \"After Dark\" filter",
  "Uncensoring the details",
  "Drawing the good bits",
  "Measuring the extra inches",
  "Rendering the hidden details",
  "Adding the fun parts",
  "Revealing what's underneath",
  "Rendering every single inch",
  "Drawing with one hand",
  "Making it extra thicc",
  "Polishing the crown jewels",
  "Turning up the studio heat",
  "Overheating the graphics card",
  "Things are getting a bit slippery",
  "Steaming up the digital glass"
] as const;

/** Drawing-kit scatter used when a sheet omits `icons`. */
export const DEFAULT_WIP_ICONS: readonly WipIcon[] = [
  Pencil,
  Paintbrush,
  Palette,
  Ruler,
  Eraser,
  Compass,
  Sparkles,
  Star,
];

/** Milliseconds a quote stays on screen before the next random pick. */
export const DEFAULT_WIP_INTERVAL = 5000;

export function isWipSheet(sheet: RefSheet): sheet is RefSheetWip {
  return sheet.wip === true || typeof sheet.wip === "object";
}

export function isImageSheet(sheet: RefSheet): sheet is RefSheetImage {
  return !isWipSheet(sheet) && "src" in sheet;
}

/** Resolve WIP display options (boolean shorthand → defaults). */
export function resolveWipOptions(sheet: RefSheetWip) {
  const options = sheet.wip === true ? {} : sheet.wip;
  return {
    badge: options.badge ?? "WIP",
    subtitle: options.subtitle ?? "Reference sheet in progress",
    quotes: options.quotes?.length
      ? [...options.quotes]
      : [...DEFAULT_WIP_QUOTES],
    icons: options.icons?.length ? [...options.icons] : [...DEFAULT_WIP_ICONS],
    iconCount: options.iconCount ?? 42,
    gradient: options.gradient?.length ? [...options.gradient] : [],
    interval: options.interval ?? DEFAULT_WIP_INTERVAL,
    aspect: options.aspect ?? "4/3",
  };
}

export function getSheetImage(
  sheet: RefSheet | undefined,
): { src: StaticImageData; alt: string } | undefined {
  if (!sheet || !isImageSheet(sheet)) return undefined;
  return { src: sheet.src, alt: sheet.title };
}
