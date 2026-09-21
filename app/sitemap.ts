import type { MetadataRoute } from "next";
import { loadContent } from "@/lib/content/loader";

const BASE = "https://www.koveline.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const { units } = loadContent();
  const mixedCourses = new Set(units.map((e) => `/${e.subject.id}/${e.course.id}/mixed`));
  const courseIndexes = new Set(
    units.filter((e) => e.course.collection === "papers").map((e) => `/${e.subject.id}/${e.course.id}`),
  );
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: BASE + "/textbooks", changeFrequency: "yearly", priority: 0.6 },
    { url: BASE + "/test", changeFrequency: "monthly", priority: 0.55 },
    ...[...courseIndexes].map((p) => ({ url: BASE + p, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...[...mixedCourses].map((p) => ({ url: BASE + p, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...units.map((e) => ({ url: BASE + e.href, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
