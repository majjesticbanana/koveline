import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Koveline — How much do you really know?",
    short_name: "Koveline",
    description: "Study resources from the Maldives — Grade 9 and Grade 10 Islam.",
    start_url: "/",
    display: "standalone",
    background_color: "#190c09",
    theme_color: "#190c09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
