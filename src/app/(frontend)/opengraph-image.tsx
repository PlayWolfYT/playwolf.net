import { ImageResponse } from "next/og";

/**
 * Site-wide embed fallback, used wherever no artwork is a better answer —
 * `/about`, `/links`, the gallery, and any page whose content has no image yet.
 * Pages that *do* have art (character sheets, artworks, projects with a cover)
 * override this from their own `generateMetadata`, and the operator can replace
 * it globally by setting `siteSettings.ogImage`.
 *
 * Drawn rather than shipped as a file so it cannot drift from the brand colours
 * in `tailwind.config.ts`, and so there is no binary in the repo to maintain.
 */
export const alt = "playwolf.net — character references, art, and portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Kept in sync with `tailwind.config.ts` / the default ramp in `globals.css`. */
const VOID = "#050506";
const GLOW = "#3abef9";
const PARCHMENT = "#f7f4ec";
const PARCHMENT_MUTED = "#c9c3b8";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: VOID,
        // Two off-centre pools of accent light, standing in for the animated
        // nebula backdrop the real pages use.
        backgroundImage: `radial-gradient(900px 520px at 18% 8%, rgba(58,190,249,0.28), transparent 70%), radial-gradient(760px 460px at 88% 96%, rgba(58,190,249,0.16), transparent 70%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 26px",
          borderRadius: 999,
          border: `1px solid rgba(58,190,249,0.45)`,
          background: "rgba(58,190,249,0.1)",
          color: GLOW,
          fontSize: 24,
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        playwolf.net
      </div>

      <div
        style={{
          marginTop: 44,
          maxWidth: 900,
          textAlign: "center",
          fontSize: 68,
          lineHeight: 1.15,
          color: PARCHMENT,
        }}
      >
        Character references, art, and portfolio
      </div>

      <div
        style={{
          marginTop: 28,
          maxWidth: 720,
          textAlign: "center",
          fontSize: 30,
          lineHeight: 1.4,
          color: PARCHMENT_MUTED,
        }}
      >
        Reference sheets, commissions, and everything else in one place.
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, transparent, ${GLOW}, transparent)`,
        }}
      />
    </div>,
    size,
  );
}
