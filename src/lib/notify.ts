import nodemailer from "nodemailer";

import { isSecureUrl } from "@/lib/safe-url";

export type NotifyInput = {
  title: string;
  message: string;
  priority?: number;
};

export type NotifyChannel = "ntfy" | "smtp" | "both";

export type NtfySettings = {
  serverUrl?: string | null;
  topic?: string | null;
  token?: string | null;
};

export type SmtpSettings = {
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  user?: string | null;
  password?: string | null;
  from?: string | null;
  to?: string | null;
};

/** Shape of `siteSettings.notifications` used by the helper. */
export type NotifySettings =
  | {
      channel?: NotifyChannel | null;
      ntfy?: NtfySettings | null;
      smtp?: SmtpSettings | null;
    }
  | null
  | undefined;

export type NotifyResult = {
  ok: boolean;
  via: string[];
  errors: string[];
};

/** Join server URL + topic into the ntfy publish URL. */
export function buildNtfyUrl(
  serverUrl: string | null | undefined,
  topic: string | null | undefined,
): string | undefined {
  if (!serverUrl?.trim() || !topic?.trim()) return undefined;
  const base = serverUrl.trim().replace(/\/+$/, "");
  const path = encodeURIComponent(topic.trim());
  return `${base}/${path}`;
}

export function isNtfyConfigured(ntfy: NtfySettings | null | undefined): boolean {
  return Boolean(buildNtfyUrl(ntfy?.serverUrl, ntfy?.topic));
}

export function isSmtpConfigured(smtp: SmtpSettings | null | undefined): boolean {
  return Boolean(smtp?.host?.trim() && smtp?.from?.trim() && smtp?.to?.trim());
}

/**
 * Which channels to attempt for a given setting.
 *
 * For `both`, only configured channels are tried — if ntfy is missing, SMTP is
 * the effective fallback (and vice versa).
 */
export function resolveNotifyChannels(
  channel: NotifyChannel | null | undefined,
  configured: { ntfy: boolean; smtp: boolean },
): Array<"ntfy" | "smtp"> {
  const mode = channel ?? "ntfy";

  if (mode === "ntfy") return configured.ntfy ? ["ntfy"] : [];
  if (mode === "smtp") return configured.smtp ? ["smtp"] : [];

  const both: Array<"ntfy" | "smtp"> = [];
  if (configured.ntfy) both.push("ntfy");
  if (configured.smtp) both.push("smtp");
  return both;
}

export function buildNtfyHeaders(
  input: NotifyInput,
  token?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    Title: input.title,
  };
  if (input.priority !== undefined) {
    headers.Priority = String(input.priority);
  }
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

async function sendNtfy(
  ntfy: NtfySettings,
  input: NotifyInput,
  fetchImpl: typeof fetch,
): Promise<void> {
  const url = buildNtfyUrl(ntfy.serverUrl, ntfy.topic);
  if (!url) throw new Error("ntfy is not configured (serverUrl/topic)");

  // The matching `validate` on `siteSettings.notifications.ntfy.serverUrl` only
  // runs on save, so a URL stored before that check existed is still live and
  // would put the access token on the wire as a plaintext bearer header. Same
  // rule, enforced where the request is actually made.
  if (!isSecureUrl(url)) {
    throw new Error(
      "serverUrl must be an https URL — the access token is sent as a bearer header (http is only allowed on localhost)",
    );
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildNtfyHeaders(input, ntfy.token),
    body: input.message,
  });

  if (!response.ok) {
    throw new Error(`ntfy responded ${response.status}`);
  }
}

async function sendSmtp(smtp: SmtpSettings, input: NotifyInput): Promise<void> {
  if (!isSmtpConfigured(smtp)) {
    throw new Error("SMTP is not configured (host/from/to)");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host!.trim(),
    port: smtp.port ?? 587,
    secure: Boolean(smtp.secure),
    auth:
      smtp.user?.trim() && smtp.password != null
        ? { user: smtp.user.trim(), pass: smtp.password }
        : undefined,
  });

  await transporter.sendMail({
    from: smtp.from!.trim(),
    to: smtp.to!.trim(),
    subject: input.title,
    text: input.message,
  });
}

/**
 * Deliver a notification through the channels configured on site settings.
 * Pure URL/channel helpers above are unit-tested without network I/O.
 */
export async function sendNotification(
  settings: NotifySettings,
  input: NotifyInput,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  const via: string[] = [];
  const errors: string[] = [];

  const channels = resolveNotifyChannels(settings?.channel, {
    ntfy: isNtfyConfigured(settings?.ntfy),
    smtp: isSmtpConfigured(settings?.smtp),
  });

  if (channels.length === 0) {
    return {
      ok: false,
      via,
      errors: ["No notification channel is configured"],
    };
  }

  for (const channel of channels) {
    try {
      if (channel === "ntfy") {
        await sendNtfy(settings?.ntfy ?? {}, input, fetchImpl);
      } else {
        await sendSmtp(settings?.smtp ?? {}, input);
      }
      via.push(channel);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${channel}: ${message}`);
    }
  }

  return { ok: via.length > 0, via, errors };
}
