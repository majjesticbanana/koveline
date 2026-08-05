import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadContent, getUnitEntry, v2LessonMap } from "@/lib/content/loader";
import { DeckEngine } from "@/components/deck/engine";

type Params = Promise<{ subject: string; course: string; unit: string; resource: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadContent().units.map((e) => ({
    subject: e.subject.id,
    course: e.course.id,
    unit: e.unit.id,
    resource: e.flashcards.id,
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { subject, course, unit, resource } = await params;
  const e = getUnitEntry(subject, course, unit, resource);
  if (!e) return { title: "Deck" };
  return {
    title: `${e.unit.titleEnglish} · Unit ${e.unit.number}`,
    description: `${e.course.title} — ${e.flashcards.cards.length} questions across ${e.unit.lessons.length} lessons.`,
  };
}

export default async function ResourcePage({ params }: { params: Params }) {
  const { subject, course, unit, resource } = await params;
  const e = getUnitEntry(subject, course, unit, resource);
  if (!e) notFound();

  return (
    <main className="mx-auto max-w-[720px] px-[22px] pb-16">
      <div className="flex items-center gap-3.5 pb-1 pt-6">
        <Link
          href="/#subjects"
          className="inline-flex items-center gap-1.5 font-bold text-on-dark-dim transition-colors hover:text-brass"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All units
        </Link>
      </div>

      <div className="mb-4 mt-2 text-center">
        <h1 lang="dv" dir="rtl" className="thaana text-[1.9rem] font-bold leading-snug text-on-dark">
          {e.unit.title}
        </h1>
        <div className="mt-1 font-display font-semibold text-brass">{e.unit.titleEnglish}</div>
        <div className="mt-0.5 text-[0.86rem] font-bold text-on-dark-dim">
          {e.course.title} · Unit {e.unit.number} · {e.flashcards.cards.length} questions
        </div>
      </div>

      <DeckEngine
        cards={e.flashcards.cards}
        lessons={e.unit.lessons}
        storageKey={e.key}
        lastStudied={{ href: e.href, label: `Unit ${e.unit.number} · ${e.unit.titleEnglish ?? e.unit.id}` }}
        v2LessonMap={v2LessonMap()}
      />
    </main>
  );
}
