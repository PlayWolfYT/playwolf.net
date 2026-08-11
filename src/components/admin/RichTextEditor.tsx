"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Waves,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { GradientEffectPicker } from "@/components/admin/GradientEffectPicker";
import { HtmlSpanMark } from "@/components/admin/tiptap-html-span";
import { TextEffectMark } from "@/components/admin/tiptap-text-effect";
import {
  normalizeGradientColors,
  TEXT_EFFECTS,
  type TextEffect,
} from "@/lib/text-effects";

type RichTextEditorProps = {
  id?: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition ${
        active
          ? "bg-sky-100 text-sky-800"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

const FIXED_EFFECTS = ["rainbow", "shake", "glow"] as const satisfies TextEffect[];

const EFFECT_ICONS: Record<(typeof FIXED_EFFECTS)[number], React.ReactNode> = {
  rainbow: <Sparkles className="h-4 w-4" />,
  shake: <Waves className="h-4 w-4" />,
  glow: <Zap className="h-4 w-4" />,
};

/**
 * TipTap WYSIWYG that speaks HTML to the schema form. On save, HTML is
 * converted back to Payload Lexical JSON via `htmlToLexical`, including the
 * custom `fx-*` text effects.
 */
export function RichTextEditor({
  id,
  value,
  disabled,
  placeholder = "Write something…",
  onChange,
}: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled && !sourceMode,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-sky-700 underline" },
      }),
      TextEffectMark,
      HtmlSpanMark,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: next }) => {
      onChange(next.getHTML());
    },
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "tiptap min-h-[8rem] px-3 py-2.5 text-sm leading-relaxed text-zinc-900 focus:outline-none " +
          "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-600 " +
          "[&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold " +
          "[&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold " +
          "[&_a]:text-sky-700 [&_a]:underline " +
          "[&_hr]:my-4 [&_hr]:border-zinc-300 " +
          "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled && !sourceMode);
  }, [disabled, editor, sourceMode]);

  // Sync external resets (e.g. after navigation with new initial values).
  useEffect(() => {
    if (!editor || sourceMode) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next && next !== "<p></p>") {
      if (current === "<p></p>" || current === "" || !editor.isFocused) {
        editor.commands.setContent(next, { emitUpdate: false });
      }
    }
  }, [editor, sourceMode, value]);

  if (!editor) {
    return (
      <div className="min-h-[10rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-400">
        Loading editor…
      </div>
    );
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function toggleSource() {
    if (!sourceMode && editor) {
      onChange(editor.getHTML());
    }
    setSourceMode((prev) => !prev);
  }

  const gradientActive = editor.isActive("textEffect", { effect: "gradient" });
  const gradientColors = normalizeGradientColors(
    editor.getAttributes("textEffect").colors,
  );

  return (
    <div
      className={`rounded-lg border border-zinc-300 bg-white shadow-sm ${
        disabled
          ? "opacity-60"
          : "focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20"
      }`}
    >
      {/* Toolbar stays overflow-visible so popovers (gradient picker) aren't clipped. */}
      <div className="relative z-20 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-zinc-200 bg-zinc-50 px-1.5 py-1">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
        {FIXED_EFFECTS.map((effect) => (
          <ToolbarButton
            key={effect}
            label={TEXT_EFFECTS[effect].label}
            active={editor.isActive("textEffect", { effect })}
            disabled={disabled || sourceMode}
            onClick={() => editor.chain().focus().toggleTextEffect(effect).run()}
          >
            {EFFECT_ICONS[effect]}
          </ToolbarButton>
        ))}
        <GradientEffectPicker
          active={gradientActive}
          disabled={disabled || sourceMode}
          currentColors={gradientColors}
          onApply={(colors) => {
            editor.chain().focus().setTextEffect("gradient", colors).run();
          }}
          onClear={() => {
            editor.chain().focus().unsetTextEffect().run();
          }}
        />
        <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          disabled={disabled || sourceMode}
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          disabled={disabled || sourceMode}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
        <ToolbarButton
          label="Undo"
          disabled={disabled || sourceMode || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || sourceMode || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
        <ToolbarButton
          label={sourceMode ? "Visual editor" : "HTML source"}
          active={sourceMode}
          disabled={disabled}
          onClick={toggleSource}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="overflow-hidden rounded-b-lg">
        {sourceMode ? (
          <textarea
            id={id}
            value={value}
            disabled={disabled}
            spellCheck={false}
            onChange={(event) => {
              onChange(event.target.value);
              editor.commands.setContent(event.target.value || "", {
                emitUpdate: false,
              });
            }}
            className="min-h-[10rem] w-full resize-y bg-zinc-50 px-3 py-2.5 font-mono text-[0.8rem] leading-relaxed text-zinc-900 outline-none"
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
}
