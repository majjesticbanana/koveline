"use client";

import { useMemo, useState } from "react";
import { Check, ListChecks, Shuffle, X } from "lucide-react";
import type { CustomTestCatalog } from "@/lib/content/loader";
import type { DeckCard } from "@/components/deck/engine";
import { DeckEngine } from "@/components/deck/engine";
import siteCopy from "@/content/site-copy.json";

type CountChoice = 10 | 20 | 50 | "all";
type OrderChoice = "random" | "sequential";

type Session = {
  id: string;
  cards: DeckCard[];
  order: OrderChoice;
  scopeCount: number;
  unitCount: number;
};

function shuffled<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function TestBuilder({
  catalog,
  v2LessonMap,
}: {
  catalog: CustomTestCatalog;
  v2LessonMap: Record<string, Record<string, string>>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<CountChoice>(20);
  const [order, setOrder] = useState<OrderChoice>("random");
  const [session, setSession] = useState<Session | null>(null);

  const grades = useMemo(() => {
    const map = new Map<number, CustomTestCatalog>();
    for (const unit of catalog) map.set(unit.grade, [...(map.get(unit.grade) ?? []), unit]);
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [catalog]);

  const chosenUnits = useMemo(() => catalog.filter((u) => selected.has(u.key)), [catalog, selected]);
  const available = chosenUnits.reduce((sum, unit) => sum + unit.cards.length, 0);

  const toggleUnit = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGrade = (grade: number, units: CustomTestCatalog) => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = units.every((unit) => next.has(unit.key));
      for (const unit of units) allSelected ? next.delete(unit.key) : next.add(unit.key);
      return next;
    });
  };

  const startTest = () => {
    if (!chosenUnits.length) return;
    const pool = chosenUnits.flatMap((unit) => unit.cards) as DeckCard[];
    const target = count === "all" ? pool.length : Math.min(count, pool.length);
    // Random mode samples across the whole selected scope, not just the first units.
    const cards = order === "random" ? shuffled(pool).slice(0, target) : pool.slice(0, target);
    setSession({
      id: `${Date.now().toString(36)}-${cards.length}`,
      cards,
      order,
      scopeCount: pool.length,
      unitCount: chosenUnits.length,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (session) {
    return (
      <div className="custom-test-session">
        <div className="test-session-head">
          <div>
            <div className="test-kicker">{siteCopy.customTest.sessionKicker}</div>
            <h1 className="font-display text-[2rem] font-extrabold leading-tight">{siteCopy.customTest.sessionTitle}</h1>
            <p className="mt-1 text-[0.86rem] text-cocoa">
              {session.cards.length} questions · {session.unitCount} units · {session.order === "random" ? "random order" : "in order"}
            </p>
          </div>
          <button type="button" onClick={() => setSession(null)} className="test-change-selection glass-control">
            {siteCopy.customTest.changeSelection}
          </button>
        </div>

        <DeckEngine
          key={session.id}
          cards={session.cards}
          lessons={[]}
          storageKey="custom-test/current"
          lastStudied={{ href: "/test", label: siteCopy.customTest.sessionKicker }}
          v2LessonMap={v2LessonMap}
          initialMode={session.order}
          freshStart
          rememberAsLastStudied={false}
        />
      </div>
    );
  }

  return (
    <div className="test-builder">
      <div className="test-builder-intro">
        <div className="test-kicker">{siteCopy.customTest.builderKicker}</div>
        <h1 className="font-display text-[clamp(2.15rem,7vw,3.35rem)] font-extrabold leading-[.98] tracking-[-.055em]">
          {siteCopy.customTest.builderTitle}
        </h1>
        <p>
          {siteCopy.customTest.builderIntro}
        </p>
      </div>

      <section className="test-step" aria-labelledby="test-scope-title">
        <div className="test-step-head">
          <div>
            <span className="test-step-number">01</span>
            <h2 id="test-scope-title">{siteCopy.customTest.scopeTitle}</h2>
          </div>
          <span>{available} questions in scope</span>
        </div>

        <div className="test-grade-stack">
          {grades.map(([grade, units]) => {
            const selectedCount = units.filter((unit) => selected.has(unit.key)).length;
            const allSelected = selectedCount === units.length;
            const gradeQuestions = units.reduce((sum, unit) => sum + unit.cards.length, 0);
            return (
              <div key={grade} className="test-grade-block">
                <button
                  type="button"
                  onClick={() => toggleGrade(grade, units)}
                  className={`test-grade-toggle ${allSelected ? "is-selected" : ""}`}
                  aria-pressed={allSelected}
                >
                  <span className="test-check">{allSelected ? <Check className="h-4 w-4" aria-hidden /> : null}</span>
                  <span>
                    <strong>Grade {grade}</strong>
                    <small>{gradeQuestions} questions · {units.length} units</small>
                  </span>
                  <em>{selectedCount}/{units.length}</em>
                </button>

                <div className="test-unit-grid">
                  {units.map((unit) => {
                    const active = selected.has(unit.key);
                    return (
                      <button
                        type="button"
                        key={unit.key}
                        onClick={() => toggleUnit(unit.key)}
                        className={`test-unit-choice ${active ? "is-selected" : ""}`}
                        aria-pressed={active}
                      >
                        <span className="test-unit-number">{String(unit.unitNumber).padStart(2, "0")}</span>
                        <span className="test-unit-copy">
                          <strong lang="dv" dir="rtl" className="thaana">{unit.title}</strong>
                          <small>{unit.titleEnglish} · {unit.cards.length}</small>
                        </span>
                        <span className="test-check">{active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="test-step" aria-labelledby="test-size-title">
        <div className="test-step-head">
          <div>
            <span className="test-step-number">02</span>
            <h2 id="test-size-title">{siteCopy.customTest.shapeTitle}</h2>
          </div>
        </div>

        <div className="test-options-grid">
          <div>
            <div className="test-option-label">{siteCopy.customTest.questionsLabel}</div>
            <div className="test-segment" role="group" aria-label="Number of questions">
              {([10, 20, 50, "all"] as CountChoice[]).map((value) => (
                <button
                  type="button"
                  key={String(value)}
                  onClick={() => setCount(value)}
                  aria-pressed={count === value}
                  className={count === value ? "is-selected" : ""}
                >
                  {value === "all" ? siteCopy.customTest.allLabel : value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="test-option-label">{siteCopy.customTest.orderLabel}</div>
            <div className="test-segment" role="group" aria-label="Question order">
              <button type="button" onClick={() => setOrder("random")} aria-pressed={order === "random"} className={order === "random" ? "is-selected" : ""}>
                <Shuffle className="h-3.5 w-3.5" aria-hidden /> {siteCopy.customTest.randomLabel}
              </button>
              <button type="button" onClick={() => setOrder("sequential")} aria-pressed={order === "sequential"} className={order === "sequential" ? "is-selected" : ""}>
                <ListChecks className="h-3.5 w-3.5" aria-hidden /> {siteCopy.customTest.sequentialLabel}
              </button>
            </div>
          </div>
        </div>
        <p className="test-option-note">{siteCopy.customTest.sizeNote}</p>
      </section>

      <div className="test-build-bar">
        <div>
          <strong>{chosenUnits.length ? `${chosenUnits.length} units selected` : siteCopy.customTest.emptySelection}</strong>
          <span>{available ? `${available} questions available` : siteCopy.customTest.gradeMixHint}</span>
        </div>
        {chosenUnits.length > 0 && (
          <button type="button" className="test-clear" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" aria-hidden /> {siteCopy.customTest.clear}
          </button>
        )}
        <button type="button" className="test-start glass-control glass-primary" disabled={!chosenUnits.length} onClick={startTest}>
          {siteCopy.customTest.build}
        </button>
      </div>
    </div>
  );
}
