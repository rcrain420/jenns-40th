import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Official-ish Fishing Tournament",
    short_name: "Official-ish",
    description:
      "Jenn's 40th Birthday Bay Bash — Rockport, TX · October 9–10, 2026.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6ecd6",
    theme_color: "#16354f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
