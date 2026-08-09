import { homeSummary, loadContent, questionOfTheDay, v2LessonMap } from "@/lib/content/loader";
import { Home } from "@/components/home";

// Question of the Day is date-sensitive, so the homepage must not be frozen at build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const summary = homeSummary();
  // card ids only — the home page never ships every card body
  const cardIds = Object.fromEntries(
    loadContent().units.map((e) => [e.key, e.flashcards.cards.map((c) => c.id)]),
  );
  return (
    <Home
      summary={summary}
      cardIds={cardIds}
      v2LessonMap={v2LessonMap()}
      qotd={questionOfTheDay()}
    />
  );
}
