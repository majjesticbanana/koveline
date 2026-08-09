import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadContent, getCourseUnits, v2LessonMap } from "@/lib/content/loader";
import { DeckEngine, type DeckCard } from "@/components/deck/engine";
import siteCopy from "@/content/site-copy.json";

type Params = Promise<{ subject: string; course: string }>;

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

export async function generateMetadata({ params }: { params: Params }) {
  const { subject, course } = await params;
  const units = getCourseUnits(subject, course);
  if (units.length === 0) return { title: siteCopy.study.studyEverything };
  const total = units.reduce((n, e) => n + e.flashcards.cards.length, 0);
  return {
    title: `${siteCopy.study.studyEverything} · ${units[0].course.title}`,
    description: `All ${total} questions from ${units[0].course.title} in one deck.`,
  };
}

export default async function MixedPage({ params }: { params: Params }) {
  const { subject, course } = await params;
  const units = getCourseUnits(subject, course);
  if (units.length === 0) notFound();
  const c = units[0].course;

  // Every card from every unit, ids prefixed so they stay unique.
  const cards: DeckCard[] = units.flatMap((e) => {
    const lessonTitle = new Map(e.unit.lessons.map((l) => [l.id, l.title]));
    return e.flashcards.cards.map((card) => ({
      ...card,
      id: `${e.unit.id}:${card.id}`,
      unitBadge: {
        grade: e.course.grade ?? 0,
        number: e.unit.number,
        titleEnglish: e.unit.titleEnglish ?? e.unit.id,
        lessonTitle: lessonTitle.get(card.lessonId),
      },
    }));
  });

  return (
    <main className="resource-page mx-auto max-w-[720px] px-[22px] pb-16">
      <div className="resource-breadcrumb flex items-center gap-3.5 pb-1 pt-6">
        <Link
          href="/#subjects"
          className="inline-flex items-center gap-1.5 font-bold text-cocoa transition-colors hover:text-coffee"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {siteCopy.study.allUnits}
        </Link>
      </div>

      <div className="resource-heading mb-4 mt-2 text-center">
        <h1 className="resource-title font-display text-[1.8rem] font-extrabold leading-snug">{siteCopy.study.studyEverything}</h1>
        <div className="resource-meta mt-0.5 text-[0.84rem] font-semibold text-cocoa">
          {c.title} · {siteCopy.study.everyUnit} · {cards.length} questions
        </div>
      </div>

      <DeckEngine
        cards={cards}
        lessons={[]}
        storageKey={`${subject}/${course}/mixed`}
        lastStudied={{ href: `/${subject}/${course}/mixed`, label: `${siteCopy.study.everythingLabel} · ${c.title}` }}
        v2LessonMap={v2LessonMap()}
      />
    </main>
  );
}
