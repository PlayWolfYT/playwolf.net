import { createServerFeature } from "@payloadcms/richtext-lexical";

/**
 * Text effects for the Lexical editor: fixed TextState-style effects (rainbow,
 * shake, glow, shimmer, float, pulse) plus a custom gradient colour-stop
 * picker. Replaces stock `TextStateFeature` so gradient stops can live under
 * `$gradientColors` / `style` the public site already reads.
 */
export const TextEffectsFeature = createServerFeature({
  feature: {
    ClientFeature:
      "@/payload/lexical/textEffects/feature.client#TextEffectsFeatureClient",
  },
  key: "textEffects",
});
