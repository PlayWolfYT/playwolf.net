import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "playwolf.net",
    short_name: "playwolf",
    description: "PlayWolf's personal site for characters, artwork, and side projects.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0c0b",
    theme_color: "#0d0c0b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
