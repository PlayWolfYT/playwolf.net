"use client";

import { TextField, useField } from "@payloadcms/ui";
import { useEffect, useRef } from "react";
import type { TextFieldClientComponent } from "payload";

import { detectLinkKind } from "@/lib/detectLinkKind";

/**
 * Default URL text field, plus a side effect: when the URL changes, the sibling
 * `kind` select is set to whatever `detectLinkKind` infers. Existing documents
 * are left alone until the URL is edited, so a manual kind override survives a
 * reopen. Typing a new URL (or pasting over one) re-runs detection.
 */
export const LinkUrlField: TextFieldClientComponent = (props) => {
  const { path } = props;
  const { value: url } = useField<string>({ path });
  const kindPath = path.split(".").slice(0, -1).concat("kind").join(".");
  const { setValue: setKind, value: kind } = useField<string>({ path: kindPath });
  const previousUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    const next = typeof url === "string" ? url : "";
    if (previousUrl.current === undefined) {
      previousUrl.current = next;
      return;
    }
    if (previousUrl.current === next) return;
    previousUrl.current = next;

    const detected = detectLinkKind(next);
    if (detected !== kind) setKind(detected);
  }, [kind, setKind, url]);

  return <TextField {...props} />;
};

export default LinkUrlField;
