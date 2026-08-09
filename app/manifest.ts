import type { MetadataRoute } from "next";
import siteCopy from "@/content/site-copy.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteCopy.metadata.siteTitle,
    short_name: siteCopy.brand.name,
    description: siteCopy.metadata.manifestDescription,
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
