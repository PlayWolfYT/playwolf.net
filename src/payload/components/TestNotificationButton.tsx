"use client";

import { Button, FieldLabel, toast } from "@payloadcms/ui";
import { useState } from "react";
import type { UIFieldClientComponent } from "payload";

/**
 * Admin-only control that POSTs to the Site Settings custom endpoint and
 * delivers a test message through the *saved* notification settings.
 */
export const TestNotificationButton: UIFieldClientComponent = ({ field }) => {
  const [pending, setPending] = useState(false);

  async function sendTest() {
    setPending(true);
    try {
      const response = await fetch("/api/globals/siteSettings/test-notification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        via?: string[];
        errors?: string[];
        error?: string;
      } | null;

      if (body?.ok) {
        const via = body.via?.length ? ` via ${body.via.join(", ")}` : "";
        toast.success(`Test notification sent${via}.`);
        if (body.errors?.length) {
          toast.error(body.errors.join("; "));
        }
        return;
      }

      toast.error(
        body?.errors?.join("; ") ??
          body?.error ??
          (response.ok
            ? "No channel delivered."
            : `Request failed (${response.status})`),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="field-type test-notification-button">
      <FieldLabel label={field?.label ?? "Test notification"} />
      <p
        style={{
          color: "var(--theme-elevation-600)",
          fontSize: 13,
          lineHeight: 1.45,
          margin: "0 0 0.75rem",
        }}
      >
        Sends a test message using the <strong>saved</strong> notification settings
        below. Save the form first if you just changed credentials.
      </p>
      <Button
        buttonStyle="secondary"
        disabled={pending}
        onClick={() => void sendTest()}
      >
        {pending ? "Sending…" : "Send test notification"}
      </Button>
    </div>
  );
};
