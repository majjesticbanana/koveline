import { homeSummary, loadContent, v2LessonMap } from "@/lib/content/loader";
import { Home } from "@/components/home";

export default function HomePage() {
  const summary = homeSummary();
  // card ids only — the home page never ships card bodies
  const cardIds = Object.fromEntries(
    loadContent().units.map((e) => [e.key, e.flashcards.cards.map((c) => c.id)]),
  );
  return <Home summary={summary} cardIds={cardIds} v2LessonMap={v2LessonMap()} />;
}
