import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { RichTextValue } from "@/lib/content";
import {
  ALLOWED_STYLE_PROPERTIES,
  RichTextContent,
  allowedStyleDeclarations,
  richTextToMetaDescription,
  richTextToPlainText,
  truncateForMetaDescription,
} from "@/lib/rich-text";
import {
  GRADIENT_COLORS_STATE_KEY,
  NODE_STATE_KEY,
  TEXT_EFFECTS,
  TEXT_EFFECT_STATE_KEY,
  gradientTextStyle,
  gradientTextStyleObject,
} from "@/lib/text-effects";

type TextNodeOverrides = {
  state?: Record<string, unknown>;
  style?: string;
  text?: string;
};

function textNode({ state, style = "", text = "gradient" }: TextNodeOverrides) {
  return {
    type: "text",
    text,
    format: 0,
    style,
    detail: 0,
    mode: "normal",
    version: 1,
    ...(state ? { [NODE_STATE_KEY]: state } : {}),
  };
}

function doc(...children: unknown[]): RichTextValue {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children,
          direction: null,
          format: "",
          indent: 0,
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
    // The frontend only ever reads `root`; the stored type is wider.
  } as unknown as RichTextValue;
}

// Called rather than written as JSX so this stays a `.ts` file, which is what
// `tsconfig.json` excludes from `tsc --noEmit` (`bun:test` has no types here).
function render(value: RichTextValue): string {
  return renderToStaticMarkup(RichTextContent({ value }));
}

const STOPS = ["#ff0000", "#00ff00", "#0000ff"];

/** What the emitted `background-image` must look like once React serializes it. */
const GRADIENT_CSS = `background-image:${gradientTextStyleObject(STOPS).backgroundImage}`;

/** Hyphenated CSS property -> the camelCased name React (and the allow-list) uses. */
function camelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

describe("style allow-list", () => {
  test("covers every property the gradient emitter produces", () => {
    for (const prop of Object.keys(gradientTextStyleObject(STOPS))) {
      expect(ALLOWED_STYLE_PROPERTIES.has(prop)).toBe(true);
    }
  });

  test("covers the CSS of every editor effect", () => {
    for (const effect of Object.values(TEXT_EFFECTS)) {
      for (const prop of Object.keys(effect.css)) {
        expect(ALLOWED_STYLE_PROPERTIES.has(camelCase(prop))).toBe(true);
      }
    }
  });

  test("keeps the gradient CSS the editor parks on a text node", () => {
    expect(allowedStyleDeclarations(gradientTextStyle(STOPS))).toEqual(
      gradientTextStyleObject(STOPS),
    );
  });

  test("drops properties outside the allow-list", () => {
    expect(
      allowedStyleDeclarations(
        "position: fixed; inset: 0; z-index: 99; opacity: 0.01; color: red",
      ),
    ).toEqual({ color: "red" });
  });

  test("drops custom properties", () => {
    expect(allowedStyleDeclarations("--fx-gradient-stops: #aaa, #bbb")).toEqual({});
  });

  test("rejects external references even on allow-listed properties", () => {
    expect(
      allowedStyleDeclarations("background-image: url(https://evil.example/pixel.png)"),
    ).toEqual({});
    expect(
      allowedStyleDeclarations(
        'background-image: image-set("https://evil.example/a.png" 1x)',
      ),
    ).toEqual({});
    expect(allowedStyleDeclarations("color: EXPRESSION(alert(1))")).toEqual({});
  });

  test("rejects backslash-escaped spellings of url()", () => {
    expect(
      allowedStyleDeclarations("background-image: \\75 rl(https://evil.example/p.png)"),
    ).toEqual({});
  });
});

describe("gradient rendering", () => {
  test("renders stored gradient stops as inline CSS", () => {
    const html = render(
      doc(
        textNode({
          state: {
            [TEXT_EFFECT_STATE_KEY]: "gradient",
            [GRADIENT_COLORS_STATE_KEY]: STOPS,
          },
          style: gradientTextStyle(STOPS),
        }),
      ),
    );
    expect(html).toContain('class="fx-gradient"');
    expect(html).toContain(GRADIENT_CSS);
    expect(html).toContain("-webkit-background-clip:text");
    expect(html).toContain("background-clip:text");
    expect(html).toContain("color:transparent");
  });

  test("recovers stops from the style field when node state is stripped", () => {
    const html = render(
      doc(
        textNode({
          state: { [TEXT_EFFECT_STATE_KEY]: "gradient" },
          style: gradientTextStyle(STOPS),
        }),
      ),
    );
    expect(html).toContain(GRADIENT_CSS);
    expect(html).toContain("color:transparent");
  });

  test("sanitizes the fallback branch when neither parser finds stops", () => {
    const html = render(
      doc(
        textNode({
          state: { [TEXT_EFFECT_STATE_KEY]: "gradient" },
          style:
            "color: red; position: fixed; inset: 0; background-image: url(https://evil.example/p.png)",
        }),
      ),
    );
    expect(html).toContain("color:red");
    expect(html).not.toContain("position");
    expect(html).not.toContain("evil.example");
  });

  test("emits the class only for the fixed effects", () => {
    const html = render(
      doc(textNode({ state: { [TEXT_EFFECT_STATE_KEY]: "rainbow" }, text: "rainbow" })),
    );
    expect(html).toContain('class="fx-rainbow"');
    expect(html).not.toContain("style=");
  });

  test("ignores inbound htmlClass / htmlStyle", () => {
    const html = render(
      doc(
        textNode({
          state: {
            htmlClass: "absolute inset-0",
            htmlStyle: "position: fixed; top: 0",
          },
          text: "plain",
        }),
      ),
    );
    expect(html).toBe(
      '<div class="break-words [overflow-wrap:anywhere] [&amp;_img]:max-w-full [&amp;_video]:max-w-full [&amp;_iframe]:max-w-full"><p>plain</p></div>',
    );
  });
});

describe("link converter", () => {
  function linkDoc(url: string) {
    return doc({
      type: "link",
      fields: { linkType: "custom", newTab: true, url },
      children: [textNode({ text: "click" })],
      direction: null,
      format: "",
      indent: 0,
      version: 3,
    });
  }

  test("renders an allow-listed href", () => {
    const html = render(linkDoc("https://playwolf.net"));
    expect(html).toContain('href="https://playwolf.net"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  test("renders unsafe hrefs as plain text", () => {
    for (const url of [
      "javascript:alert(1)",
      "  JavaScript:alert(1)",
      "java\tscript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
    ]) {
      const html = render(linkDoc(url));
      expect(html).toContain("click");
      expect(html).not.toContain("<a");
    }
  });
});

describe("meta descriptions", () => {
  const long = doc(textNode({ text: `${"word ".repeat(60)}end` }));

  test("leaves short text alone", () => {
    expect(richTextToMetaDescription(doc(textNode({ text: "Short blurb." })))).toBe(
      "Short blurb.",
    );
  });

  test("truncates on a word boundary within the budget", () => {
    const description = richTextToMetaDescription(long);
    expect(description).toBeDefined();
    expect(description!.length).toBeLessThanOrEqual(160);
    expect(description!.endsWith("…")).toBe(true);
    expect(description).not.toContain("wor…");
  });

  test("leaves richTextToPlainText untruncated for JSON-LD", () => {
    const plain = richTextToPlainText(long);
    expect(plain!.length).toBeGreaterThan(160);
    expect(plain!.endsWith("end")).toBe(true);
  });

  test("adds no ellipsis when nothing was dropped", () => {
    expect(truncateForMetaDescription("exactly ten", 11)).toBe("exactly ten");
    expect(truncateForMetaDescription("a longer sentence here", 12)).toBe("a longer…");
  });

  test("hard-clips a single unbroken word", () => {
    expect(truncateForMetaDescription("x".repeat(20), 10)).toBe(`${"x".repeat(9)}…`);
  });

  test("returns undefined for empty input", () => {
    expect(truncateForMetaDescription(undefined)).toBeUndefined();
    expect(truncateForMetaDescription("   ")).toBeUndefined();
    expect(richTextToMetaDescription(undefined)).toBeUndefined();
  });
});
