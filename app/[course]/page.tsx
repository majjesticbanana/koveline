import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadContent, getCourseUnits } from "@/lib/content/loader";
import { PaperList, type PaperEntry } from "@/components/paper-list";

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

export async function generateMetadata(
  { params }: { params: Promise<{ subject: string; course: string }> },
): Promise<Metadata> {
  const { subject, course } = await params;
  const units = getCourseUnits(subject, course);
  const title = units[0]?.course.title ?? "Course";
  return { title, description: `${title} — every paper, with its marking scheme.` };
}

/**
 * Course index.
 *
 * A syllabus course has no index of its own — the home page lists its units,
 * so this redirects there, as it always has. A course of past papers does
 * need one: the units are years rather than topics, and you want to sort
 * them. That is the only case this page renders.
 */
export default async function CoursePage(
  { params }: { params: Promise<{ subject: string; course: string }> },
) {
  const { subject, course } = await params;
  const units = getCourseUnits(subject, course);
  const c = units[0]?.course;

  if (!c || c.collection !== "papers") redirect("/#subjects");

  const papers: PaperEntry[] = units.map((e) => ({
    key: e.key,
    href: e.href,
    title: e.unit.title,
    year: e.unit.year ?? e.unit.title.slice(0, 4),
    questionCount: e.flashcards.cards.length,
    lessonCount: e.unit.lessons.length,
  }));
  const total = papers.reduce((n, p) => n + p.questionCount, 0);

  return (
    <main className="mx-auto max-w-[820px] px-5 pb-16 pt-6">
      <Link href="/" className="paper-back">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Home
      </Link>

      <header className="paper-intro">
        <p className="paper-kicker">{c.collectionTitle ?? "Past papers"}</p>
        <h1>{c.title}</h1>
        <p className="paper-sub">
          {total} questions across {papers.length} papers, each with its marking scheme.
        </p>
        <Link href={`/${subject}/${course}/mixed`} className="paper-all">
          Study everything · {total}
        </Link>
      </header>

      <PaperList papers={papers} />
    </main>
  );
}
