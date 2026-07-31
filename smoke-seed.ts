import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });

const artist = await payload.create({
  collection: "artists",
  data: {
    name: "Smoke Artist",
    slug: "smoke-artist",
    links: [
      { kind: "telegram", url: "https://t.me/smokeone" },
      { kind: "telegram", url: "https://t.me/smoketwo", description: "Art Channel" },
      { kind: "email", url: "smoke@example.com" },
    ],
  },
});

await payload.create({
  collection: "characters",
  data: {
    name: "Smoke Wolf",
    slug: "smoke-wolf",
    species: "Husky/Shepherd-Mix",
    sfw: {
      enabled: true,
      label: "SFW",
      accentColor: "#8EEDFF",
      sheet: {
        kind: "wip",
        title: "Smoke Wolf Reference",
        artist: artist.id,
        wip: {
          badge: "WIP",
          aspect: "4/3",
          iconCount: 12,
          icons: [{ name: "pencil" }, { name: "palette" }],
          gradient: [{ color: "#8EEDFF" }, { color: "#B47CFF" }],
        },
      },
    },
    nsfw: { enabled: true, label: "After Dark", accentColor: "#FF5F6D" },
  },
});

await payload.create({
  collection: "projects",
  data: {
    title: "Smoke Project",
    slug: "smoke-project",
    summary: "A project used only to prove the routes render.",
    status: "wip",
    year: 2026,
    featured: true,
    links: [{ kind: "website", url: "https://example.com/smoke" }],
  },
});

await payload.updateGlobal({
  slug: "siteSettings",
  data: {
    heroTitle: "Smoke Hero Title",
    heroTagline: "Smoke hero tagline.",
    links: [{ kind: "bluesky", url: "https://bsky.app/profile/smoke" }],
  },
});

console.log("seeded");
process.exit(0);
