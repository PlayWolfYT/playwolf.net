import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  TextStateFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from "@payloadcms/richtext-lexical";

import { TEXT_EFFECT_STATE_KEY, TEXT_EFFECTS } from "../lib/text-effects";

const textEffectState = Object.fromEntries(
  Object.entries(TEXT_EFFECTS).map(([key, effect]) => [
    key,
    { label: effect.label, css: effect.css },
  ]),
);

/**
 * Editor used by every rich-text field. Deliberately narrow: prose plus the
 * bounded effect set, no blocks or uploads, since profile descriptions are
 * blurbs rather than page bodies.
 */
export const richTextEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    BlockquoteFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    HorizontalRuleFeature(),
    LinkFeature({ enabledCollections: [] }),
    InlineToolbarFeature(),
    TextStateFeature({ state: { [TEXT_EFFECT_STATE_KEY]: textEffectState } }),
  ],
});
