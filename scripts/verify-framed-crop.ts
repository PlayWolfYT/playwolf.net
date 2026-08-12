/**
 * Integration smoke for non-destructive framed cropping.
 *
 * Exercises the sharp pad→extract→WebP path (research probe) and the Payload
 * Local API create/re-crop path against local Postgres + Garage. Not a unit
 * test — run with `bun scripts/verify-framed-crop.ts` while services are up.
 */

import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

import { padAndExtractForRect, type Rect } from "../src/payload/cropGeometry";
import { getOriginal } from "../src/payload/originals/store";
import { UPLOAD_FRAMES } from "../src/payload/uploadFrames";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function probeSharpTransparentPad(): Promise<void> {
  const sourceW = 400;
  const sourceH = 300;
  const source = await sharp({
    create: {
      width: sourceW,
      height: sourceH,
      channels: 3,
      background: { r: 220, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer();

  // Reach 25% past every edge — needs padding on all four sides.
  const rect: Rect = { x: -25, y: -25, width: 150, height: 150 };
  const { pad, extract, padsAnySide } = padAndExtractForRect(rect, {
    width: sourceW,
    height: sourceH,
  });
  assert(padsAnySide, "expected out-of-bounds rect to need padding");

  const extended = await sharp(source)
    .ensureAlpha()
    .extend({
      ...pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const cropped = await sharp(extended)
    .extract(extract)
    .webp({ quality: 82, alphaQuality: 100, effort: 4 })
    .toBuffer();

  const meta = await sharp(cropped).metadata();
  assert(meta.width === extract.width, `width ${meta.width} !== ${extract.width}`);
  assert(meta.height === extract.height, `height ${meta.height} !== ${extract.height}`);
  assert(meta.hasAlpha, "webp derivative must retain alpha");
  assert(meta.channels === 4, `expected 4 channels, got ${meta.channels}`);

  const { data, info } = await sharp(cropped)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Top-left corner is pure pad → fully transparent.
  const a0 = data[3];
  assert(a0 === 0, `top-left alpha should be 0, got ${a0}`);

  // Centre of the result should still contain opaque source pixels.
  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const centreAlpha = data[(cy * info.width + cx) * info.channels + 3];
  assert(centreAlpha === 255, `centre alpha should be 255, got ${centreAlpha}`);

  console.log("✓ sharp pad/extract/webp probe (transparent corners)");
}

async function probePayloadPipeline(): Promise<void> {
  // Garage is on loopback for local scripts; compose uses the service name.
  if (!process.env.S3_ENDPOINT || process.env.S3_ENDPOINT.includes("garage:")) {
    process.env.S3_ENDPOINT = "http://localhost:7900";
  }

  const payload = await getPayload({ config });
  const frame = UPLOAD_FRAMES["project-images"];

  const sourceW = 640;
  const sourceH = 480;
  const png = await sharp({
    create: {
      width: sourceW,
      height: sourceH,
      channels: 3,
      background: { r: 40, g: 180, b: 80 },
    },
  })
    .png()
    .toBuffer();

  const created = await payload.create({
    collection: "project-images",
    data: { alt: "framed-crop-verify" },
    file: {
      data: png,
      mimetype: "image/png",
      name: "framed-crop-verify.png",
      size: png.length,
    },
    overrideAccess: true,
  });

  assert(created.id, "create returned no id");
  assert(created.source?.key, "create did not persist source.key sidecar");
  assert(created.source?.width === sourceW, `source.width ${created.source?.width}`);
  assert(created.source?.height === sourceH, `source.height ${created.source?.height}`);
  assert(created.mimeType === "image/webp", `expected webp, got ${created.mimeType}`);
  assert(
    created.filename?.endsWith(".webp"),
    `expected .webp filename, got ${created.filename}`,
  );
  assert(created.crop, "create did not persist crop");

  const sidecar = await getOriginal(created.source.key);
  assert(sidecar, "sidecar missing from Garage after create");
  const sidecarMeta = await sharp(sidecar.body).metadata();
  assert(sidecarMeta.width === sourceW, "sidecar width drifted");
  assert(sidecarMeta.height === sourceH, "sidecar height drifted");
  assert(
    sidecarMeta.format === "png",
    `sidecar should stay png, got ${sidecarMeta.format}`,
  );

  // Out-of-bounds 16:9 crop: start 20% left of the original, cover 140% width.
  // height% of original so pixel aspect is frame.aspect:
  //   (w%/100)*W / ((h%/100)*H) = aspect  =>  h% = w% * (W/H) / aspect
  const oobWidth = 140;
  const heightPct = (oobWidth * (sourceW / sourceH)) / frame.aspect;
  const oobCrop: Rect = {
    x: -20,
    y: (100 - heightPct) / 2,
    width: oobWidth,
    height: heightPct,
  };

  const updated = await payload.update({
    collection: "project-images",
    id: created.id,
    data: { crop: oobCrop },
    overrideAccess: true,
    // Local API does not auto-set uploadEdits; crop on data is enough for the hook.
  });

  assert(
    updated.source?.key === created.source.key,
    "re-crop must keep the same sidecar key",
  );
  assert(Math.abs((updated.crop?.x ?? 0) - oobCrop.x) < 0.01, "crop.x not persisted");
  assert(
    Math.abs((updated.crop?.width ?? 0) - oobCrop.width) < 0.01,
    "crop.width not persisted",
  );
  assert(updated.mimeType === "image/webp", "re-crop should stay webp");

  // Fetch the public derivative via its URL and check transparent padding.
  assert(updated.url, "updated doc has no url");
  let fileURL = updated.url;
  if (!fileURL.startsWith("http")) {
    fileURL = `http://localhost:3000${fileURL}`;
  }

  const res = await fetch(fileURL);
  assert(res.ok, `derivative fetch failed: ${res.status} ${fileURL}`);
  const body = Buffer.from(await res.arrayBuffer());
  const derMeta = await sharp(body).metadata();
  assert(
    derMeta.hasAlpha,
    "project-images pad is transparent — derivative needs alpha",
  );

  const { data, info } = await sharp(body)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const leftPadAlpha = data[3];
  assert(
    leftPadAlpha === 0,
    `left-edge pixel should be transparent pad, alpha=${leftPadAlpha}`,
  );

  // sizes.frame should exist and match the reference aspect.
  const frameSize = updated.sizes?.frame;
  assert(frameSize?.url, "sizes.frame missing after re-crop");
  if (frameSize?.width && frameSize?.height) {
    const aspect = frameSize.width / frameSize.height;
    assert(
      Math.abs(aspect - frame.aspect) < 0.05,
      `sizes.frame aspect ${aspect} !~ ${frame.aspect}`,
    );
  }

  // Original route: unauthenticated → 401.
  const unauth = await fetch(
    `http://localhost:3000/api/original/project-images/${created.id}`,
  );
  assert(
    unauth.status === 401,
    `original route without auth expected 401, got ${unauth.status}`,
  );

  // Authenticated: mint/login a throwaway admin and stream the sidecar.
  const email = `framed-crop-verify-${Date.now()}@example.com`;
  const password = "FramedCropVerify1!";
  await payload.create({
    collection: "users",
    data: { email, password },
    overrideAccess: true,
  });
  const login = await fetch("http://localhost:3000/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(login.ok, `login failed: ${login.status} ${await login.text()}`);
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookieHeader =
    setCookie.map((c) => c.split(";")[0]).join("; ") ||
    login.headers
      .get("set-cookie")
      ?.split(",")
      .map((c) => c.split(";")[0].trim())
      .join("; ");
  assert(cookieHeader, "login returned no session cookie");

  const authed = await fetch(
    `http://localhost:3000/api/original/project-images/${created.id}`,
    { headers: { cookie: cookieHeader } },
  );
  assert(authed.ok, `original route with auth expected 200, got ${authed.status}`);
  const originalBody = Buffer.from(await authed.arrayBuffer());
  const originalMeta = await sharp(originalBody).metadata();
  assert(originalMeta.width === sourceW, "auth original width mismatch");
  assert(originalMeta.height === sourceH, "auth original height mismatch");
  assert(originalMeta.format === "png", "auth original should be the pristine PNG");

  // Clean up the smoke document (also exercises afterDelete sidecar cleanup).
  await payload.delete({
    collection: "project-images",
    id: created.id,
    overrideAccess: true,
  });
  const gone = await getOriginal(created.source.key);
  assert(!gone, "sidecar should be deleted with the document");

  const users = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  if (users.docs[0]) {
    await payload.delete({
      collection: "users",
      id: users.docs[0].id,
      overrideAccess: true,
    });
  }

  console.log(
    "✓ Payload create → re-crop (oob transparent) → original 401/200 → cleanup",
  );
  console.log(`  source.key kept across re-crop: ${created.source.key}`);
  console.log(
    `  derivative ${derMeta.width}×${derMeta.height} webp, sizes.frame=${frameSize?.width}×${frameSize?.height}`,
  );
}

await probeSharpTransparentPad();
await probePayloadPipeline();
console.log("\nAll framed-crop verification probes passed.");
process.exit(0);
