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
  UnderlineFeature,
  UnorderedListFeature,
} from "@payloadcms/richtext-lexical";

import { TextEffectsFeature } from "./lexical/textEffects/feature.server";

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
    TextEffectsFeature(),
  ],
});
