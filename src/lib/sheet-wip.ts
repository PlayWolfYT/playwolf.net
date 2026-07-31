import type { WipIconName } from "@/lib/content";

/** Built-in quote pool used when a WIP sheet lists none of its own. */
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
  "Applying final touches",
] as const;

/** Swapped in as the default pool on After Dark profiles. */
export const NSFW_WIP_QUOTES = [
  "Unbuttoning the pants",
  "Undressing the ref",
  "Pulling down the shorts",
  "Dropping the clothes",
  "Slipping out of the outfit",
  "Removing the clothes layer",
  "Dimming the studio lights",
  'Putting on the "After Dark" filter',
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
  "Steaming up the digital glass",
] as const;

/**
 * Drawing-kit scatter used when a sheet picks no icons of its own. Kebab-case
 * lucide names, the same vocabulary the admin's icon picker writes.
 */
export const DEFAULT_WIP_ICONS: readonly WipIconName[] = [
  "pencil",
  "paintbrush",
  "palette",
  "ruler",
  "eraser",
  "compass",
  "sparkles",
  "star",
];

/** Milliseconds a quote stays on screen before the next random pick. */
export const DEFAULT_WIP_INTERVAL = 5000;

export const DEFAULT_WIP_ICON_COUNT = 42;
