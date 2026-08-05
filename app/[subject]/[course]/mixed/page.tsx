import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadContent, getCourseUnits, v2LessonMap } from "@/lib/content/loader";
import { DeckEngine, type DeckCard } from "@/components/deck/engine";

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
  if (units.length === 0) return { title: "Study everything" };
  const total = units.reduce((n, e) => n + e.flashcards.cards.length, 0);
  return {
    title: `Study everything · ${units[0].course.title}`,
    description: `All ${total} questions from ${units[0].course.title} in one deck.`,
  };
}

export default async function MixedPage({ params }: { params: Params }) {
  const { subject, course } = await params;
  const units = getCourseUnits(subject, course);
  if (units.length === 0) notFound();
  const c = units[0].course;

  // Every card from every unit, ids prefixed so they stay unique.
  const cards: DeckCard[] = units.flatMap((e) =>
    e.flashcards.cards.map((card) => ({
      ...card,
      id: `${e.unit.id}:${card.id}`,
      unitBadge: { number: e.unit.number, titleEnglish: e.unit.titleEnglish ?? e.unit.id },
    })),
  );

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
        <h1 className="font-display text-[1.9rem] font-bold leading-snug text-on-dark">Study everything</h1>
        <div className="mt-0.5 text-[0.86rem] font-bold text-on-dark-dim">
          {c.title} · every unit · {cards.length} questions
        </div>
      </div>

      <DeckEngine
        cards={cards}
        lessons={[]}
        storageKey={`${subject}/${course}/mixed`}
        lastStudied={{ href: `/${subject}/${course}/mixed`, label: `Everything · ${c.title}` }}
        v2LessonMap={v2LessonMap()}
      />
    </main>
  );
}
