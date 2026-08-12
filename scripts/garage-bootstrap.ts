/**
 * Idempotent local Garage bootstrap for `bun run dev:up`.
 *
 * Uses Bun.spawn with argv arrays (not a shell string) so Git Bash on Windows
 * cannot rewrite the container-internal `/garage` path to
 * `C:/Program Files/Git/garage`.
 *
 * Credentials are read from `.env` — this script never invents secrets. Garage
 * requires Key ID = `GK` + 24 hex chars and Secret = 64 hex chars.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMPOSE_FILES = ["-f", "docker-compose.yml", "-f", "docker-compose.dev.yml"];
const GARAGE_BIN = "/garage";
const KEY_NAME = "playwolf-dev";
const ZONE = "dev";
const CAPACITY = "10G";

const KEY_ID_RE = /^GK[0-9a-fA-F]{24}$/;
const SECRET_RE = /^[0-9a-fA-F]{64}$/;

const STATUS_RETRIES = 30;
const STATUS_DELAY_MS = 1000;

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name} in the environment (or .env). Copy .env.example and set the pinned local Garage credentials.`,
    );
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

async function run(
  cmd: string[],
  opts: { allowFailure?: boolean } = {},
): Promise<RunResult> {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0 && !opts.allowFailure) {
    const detail = [stdout, stderr].filter(Boolean).join("\n").trim();
    throw new Error(
      `Command failed (${code}): ${cmd.join(" ")}\n${detail || "(no output)"}`,
    );
  }
  return { code, stdout, stderr };
}

async function garage(...args: string[]): Promise<RunResult> {
  // `-T` disables TTY allocation so output is plain text under docker compose.
  return run([
    "docker",
    "compose",
    ...COMPOSE_FILES,
    "exec",
    "-T",
    "garage",
    GARAGE_BIN,
    ...args,
  ]);
}

async function garageAllowFail(...args: string[]): Promise<RunResult> {
  return run(
    [
      "docker",
      "compose",
      ...COMPOSE_FILES,
      "exec",
      "-T",
      "garage",
      GARAGE_BIN,
      ...args,
    ],
    { allowFailure: true },
  );
}

function parseNodeId(statusOut: string): string | null {
  // Healthy-node table rows start with a 16-char hex id.
  for (const line of statusOut.split(/\r?\n/)) {
    const m = line.match(/^([0-9a-f]{16})\b/i);
    if (m) return m[1]!;
  }
  return null;
}

function hasRoleAssigned(statusOut: string): boolean {
  return !/NO ROLE ASSIGNED/i.test(statusOut);
}

function parseLayoutVersion(layoutOut: string): number {
  // Garage prints something like "Current layout version: 1" or "version: 0".
  const m =
    layoutOut.match(/Current\s+layout\s+version:\s*(\d+)/i) ??
    layoutOut.match(/\bversion:\s*(\d+)/i);
  if (!m) return 0;
  return Number.parseInt(m[1]!, 10);
}

async function waitForNode(): Promise<string> {
  let last = "";
  for (let i = 0; i < STATUS_RETRIES; i++) {
    const result = await garageAllowFail("status");
    last = [result.stdout, result.stderr].join("\n");
    const nodeId = parseNodeId(result.stdout || result.stderr);
    if (result.code === 0 && nodeId) {
      return nodeId;
    }
    await sleep(STATUS_DELAY_MS);
  }
  throw new Error(
    `Garage did not become ready after ${STATUS_RETRIES}s.\nLast status output:\n${last.trim() || "(empty)"}`,
  );
}

async function ensureLayout(nodeId: string): Promise<void> {
  const status = await garage("status");
  if (hasRoleAssigned(status.stdout)) {
    console.log("Layout already assigned — skipping.");
    return;
  }

  console.log(`Assigning layout: zone=${ZONE} capacity=${CAPACITY} node=${nodeId}`);
  await garage("layout", "assign", "-z", ZONE, "-c", CAPACITY, nodeId);

  const show = await garage("layout", "show");
  const current = parseLayoutVersion(show.stdout);
  const next = current + 1;
  console.log(`Applying layout version ${next} (was ${current}).`);
  await garage("layout", "apply", "--version", String(next));
}

async function ensureBucket(bucket: string): Promise<void> {
  const info = await garageAllowFail("bucket", "info", bucket);
  if (info.code === 0) {
    console.log(`Bucket ${bucket} already exists — skipping create.`);
    return;
  }
  console.log(`Creating bucket ${bucket}.`);
  await garage("bucket", "create", bucket);
}

async function ensureKey(keyId: string, secret: string): Promise<void> {
  const info = await garageAllowFail("key", "info", keyId);
  if (info.code === 0) {
    console.log(`Key ${keyId} already exists — skipping import.`);
    return;
  }
  console.log(`Importing pinned key ${keyId} as ${KEY_NAME}.`);
  await garage("key", "import", "--yes", "-n", KEY_NAME, keyId, secret);
}

async function ensureAllow(bucket: string, keyId: string): Promise<void> {
  console.log(`Granting read/write/owner on ${bucket} to ${keyId}.`);
  await garage(
    "bucket",
    "allow",
    "--read",
    "--write",
    "--owner",
    bucket,
    "--key",
    keyId,
  );
}

async function main(): Promise<void> {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  loadEnvFile(resolve(root, ".env"));

  const bucket = process.env.S3_BUCKET?.trim() || "playwolf-media";
  const endpoint = process.env.S3_ENDPOINT?.trim() || "http://localhost:7900";
  const keyId = requireEnv("S3_ACCESS_KEY_ID");
  const secret = requireEnv("S3_SECRET_ACCESS_KEY");

  if (!KEY_ID_RE.test(keyId)) {
    throw new Error(
      `S3_ACCESS_KEY_ID is not a valid Garage key ID.\n` +
        `Expected GK + 24 hex characters (e.g. GKdeadbeefdeadbeefdeadbeef).\n` +
        `Got: ${keyId}`,
    );
  }
  if (!SECRET_RE.test(secret)) {
    throw new Error(
      `S3_SECRET_ACCESS_KEY is not a valid Garage secret key.\n` +
        `Expected 64 hex characters (32 bytes).\n` +
        `Got length: ${secret.length}`,
    );
  }

  console.log("Waiting for Garage node…");
  const nodeId = await waitForNode();
  console.log(`Node ready: ${nodeId}`);

  await ensureLayout(nodeId);
  await ensureBucket(bucket);
  await ensureKey(keyId, secret);
  await ensureAllow(bucket, keyId);

  console.log("");
  console.log("Garage bootstrap complete.");
  console.log(`  endpoint : ${endpoint}`);
  console.log(`  bucket   : ${bucket}`);
  console.log(`  key id   : ${keyId}`);
  console.log(`  key name : ${KEY_NAME}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
