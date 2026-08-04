import { redirect } from "next/navigation";
import { loadContent } from "@/lib/content/loader";

export const dynamicParams = false;

export function generateStaticParams() {
  const seen = new Set<string>();
  return loadContent()
    .units.filter((e) => {
      const k = `${e.subject.id}/${e.course.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((e) => ({ subject: e.subject.id, course: e.course.id }));
}

/** Course index — the home page is the course index while there is one course. */
export default function CoursePage() {
  redirect("/#subjects");
}
