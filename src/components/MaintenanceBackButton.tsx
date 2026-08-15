"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function subscribe() {
  // History length is fixed for this document view; no external subscription.
  return () => {};
}

function getSnapshot() {
  return window.history.length > 1;
}

function getServerSnapshot() {
  return false;
}

/**
 * Shown on the maintenance screen when the visitor navigated here from
 * another page (browser history is non-empty). Direct landings skip it.
 */
export function MaintenanceBackButton() {
  const canGoBack = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!canGoBack) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={() => window.history.back()}
      className="rounded-xl w-full"
    >
      <ArrowLeftIcon data-icon="inline-start" />
      Go back
    </Button>
  );
}
