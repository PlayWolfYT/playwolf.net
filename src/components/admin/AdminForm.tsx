import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Plain, server-renderable form primitives shared by every admin form. No
 * client interactivity here on purpose — the interactive pieces (pickers,
 * array editors) live in their own components; everything else is a native
 * input styled to match the site's glass / dark-void aesthetic.
 */

const baseInputClass =
  "w-full rounded-lg border border-white/10 bg-void-lift/70 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/60 shadow-inner-glow outline-none transition focus:border-glow-500/60 focus:ring-1 focus:ring-glow-500/40 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  description,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={htmlFor}
          className="font-display text-xs font-medium uppercase tracking-[0.14em] text-parchment-muted"
        >
          {label}
          {required ? <span className="ml-1 text-glow-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {description ? <p className="text-xs text-parchment-dim">{description}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type={props.type ?? "text"}
      className={`${baseInputClass} ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${baseInputClass} min-h-24 resize-y font-mono text-[0.82rem] leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="number"
      className={`${baseInputClass} ${props.className ?? ""}`}
    />
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-parchment-muted">
      <input
        {...props}
        type="checkbox"
        className="h-4 w-4 rounded border-white/20 bg-void-lift text-glow-500 accent-glow-500 focus:ring-glow-500/50"
      />
      {label}
    </label>
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${baseInputClass} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

/** Section card wrapper — the glass panel every form group sits inside. */
export function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 shadow-inner-glow sm:p-6">
      {title ? (
        <header className="mb-4">
          <h2 className="font-display text-sm font-medium tracking-wide text-parchment">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-parchment-dim">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-lg border border-glow-500/40 bg-glow-500/10 px-4 py-2 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:bg-glow-500/20 hover:text-glow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      {children}
    </button>
  );
}
