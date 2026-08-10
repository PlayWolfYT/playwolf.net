import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Shared form primitives for the admin panel — readable light chrome with
 * clear borders and focus rings (standard admin, not the public void theme).
 */

const baseInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 shadow-sm outline-none transition " +
  "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 " +
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500";

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
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800">
          {label}
          {required ? <span className="ml-1 text-sky-600">*</span> : null}
        </label>
      ) : null}
      {children}
      {description ? (
        <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
      ) : null}
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
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-800">
      <input
        {...props}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 accent-sky-600 focus:ring-sky-500/40"
      />
      <span>{label}</span>
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

/** Section card wrapper for a form group. */
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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      {title ? (
        <header className="mb-4 border-b border-zinc-100 pb-3">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
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

export function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
