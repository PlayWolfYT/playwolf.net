"use client";

import type { BaseSelection, LexicalEditor } from "lexical";

/**
 * Lives outside the floating inline toolbar. Focusing gradient inputs collapses
 * the native selection, which unmounts Payload's toolbar — if the panel were
 * rendered inside that toolbar it would disappear with it.
 */
export type GradientPanelSession = {
  editor: LexicalEditor;
  /** Lexical selection snapshot taken when the panel opened. */
  selection: BaseSelection | null;
  colors: string[];
  /** Whether the selection already had the gradient effect (shows Clear). */
  active: boolean;
  /** Toggle button rect for positioning the portaled panel. */
  anchor: { left: number; top: number; bottom: number; right: number } | null;
};

type Listener = (session: GradientPanelSession | null) => void;

let session: GradientPanelSession | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(session);
}

export function getGradientPanelSession(): GradientPanelSession | null {
  return session;
}

export function subscribeGradientPanel(listener: Listener): () => void {
  listeners.add(listener);
  listener(session);
  return () => {
    listeners.delete(listener);
  };
}

export function openGradientPanel(next: GradientPanelSession): void {
  session = next;
  emit();
}

export function updateGradientPanelColors(colors: string[]): void {
  if (!session) return;
  session = { ...session, colors };
  emit();
}

export function closeGradientPanel(): void {
  if (!session) return;
  session = null;
  emit();
}
