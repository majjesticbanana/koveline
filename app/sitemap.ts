import type { MetadataRoute } from "next";
import { loadContent } from "@/lib/content/loader";

const BASE = "https://www.koveline.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const { units } = loadContent();
  const courses = new Set(units.map((e) => `/${e.subject.id}/${e.course.id}/mixed`));
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: BASE + "/textbooks", changeFrequency: "yearly", priority: 0.6 },
    { url: BASE + "/test", changeFrequency: "monthly", priority: 0.55 },
    ...[...courses].map((p) => ({ url: BASE + p, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...units.map((e) => ({ url: BASE + e.href, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
