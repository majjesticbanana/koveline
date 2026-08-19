"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ListChecks, Shuffle, X } from "lucide-react";
import { readJSON, writeJSON, progressKey } from "@/lib/storage";
import { useSession } from "@/components/session-provider";
import type { CustomTestCatalog } from "@/lib/content/loader";
import type { DeckCard } from "@/components/deck/engine";
import { DeckEngine } from "@/components/deck/engine";
import siteCopy from "@/content/site-copy.json";

type OrderChoice = "random" | "sequential";
type SourceChoice = "all" | "unseen" | "wrong";

const PREFS_KEY = "koveline:v3:test-prefs";

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
  const { identity, syncStamp, loading: sessionLoading } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** null = every question in scope; otherwise the slider's value. */
  const [count, setCount] = useState<number | null>(20);
  const [order, setOrder] = useState<OrderChoice>("random");
  const [source, setSource] = useState<SourceChoice>("all");
  const [marks, setMarks] = useState<Record<string, "correct" | "wrong">>({});
  const [session, setSession] = useState<Session | null>(null);
  const [restored, setRestored] = useState(false);

  /* Saved marks, so "questions I got wrong" can span every deck. Re-read when
     the session settles or changes: these marks belong to one student. */
  useEffect(() => {
    if (sessionLoading) return;
    const all: Record<string, "correct" | "wrong"> = {};
    for (const unit of catalog) {
      const saved = readJSON<{ status?: Record<string, "correct" | "wrong"> }>(progressKey(unit.key, identity));
      if (!saved?.status) continue;
      // progress is keyed by the unit's own card ids; the catalog prefixes them
      for (const [cardId, mark] of Object.entries(saved.status)) {
        all[`${unit.courseId}:${unit.unitId}:${cardId}`] = mark;
      }
    }
    setMarks(all);

    const prefs = readJSON<{ units?: string[]; count?: number | null; order?: OrderChoice }>(PREFS_KEY);
    if (prefs) {
      const live = new Set(catalog.map((u) => u.key));
      if (prefs.units) setSelected(new Set(prefs.units.filter((k) => live.has(k))));
      if (prefs.count !== undefined) setCount(prefs.count);
      if (prefs.order) setOrder(prefs.order);
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, identity, syncStamp]);

  /* Remember the setup so the next test starts where this one left off. */
  useEffect(() => {
    if (!restored) return;
    writeJSON(PREFS_KEY, { units: [...selected], count, order });
  }, [selected, count, order, restored]);

  const groups = useMemo(() => {
    const map = new Map<string, CustomTestCatalog>();
    for (const unit of catalog) map.set(unit.groupId, [...(map.get(unit.groupId) ?? []), unit]);
    return [...map.entries()]
      .map(([id, units]) => ({ id, label: units[0].groupLabel, order: units[0].groupOrder, units }))
      .sort((a, b) => a.order - b.order);
  }, [catalog]);

  const chosenUnits = useMemo(() => catalog.filter((u) => selected.has(u.key)), [catalog, selected]);

  /** Every card in the chosen units, narrowed by the source filter. */
  const pool = useMemo(() => {
    const cards = chosenUnits.flatMap((unit) => unit.cards) as DeckCard[];
    if (source === "wrong") return cards.filter((c) => marks[c.id] === "wrong");
    if (source === "unseen") return cards.filter((c) => !marks[c.id]);
    return cards;
  }, [chosenUnits, source, marks]);

  const available = pool.length;
  const wrongInScope = useMemo(
    () => chosenUnits.flatMap((u) => u.cards).filter((c) => marks[c.id] === "wrong").length,
    [chosenUnits, marks],
  );

  /** Slider tops out at the scope, and "all" is the top of the track. */
  const sliderMax = Math.max(1, available);
  const effectiveCount = count === null ? available : Math.min(count, available);

  const toggleUnit = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (units: CustomTestCatalog) => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = units.every((unit) => next.has(unit.key));
      for (const unit of units) allSelected ? next.delete(unit.key) : next.add(unit.key);
      return next;
    });
  };

  const startTest = () => {
    if (!pool.length) return;
    const target = effectiveCount;
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
          {groups.map(({ id, label, units }) => {
            const selectedCount = units.filter((unit) => selected.has(unit.key)).length;
            const allSelected = selectedCount === units.length;
            const gradeQuestions = units.reduce((sum, unit) => sum + unit.cards.length, 0);
            return (
              <div key={id} className="test-grade-block">
                <button
                  type="button"
                  onClick={() => toggleGroup(units)}
                  className={`test-grade-toggle ${allSelected ? "is-selected" : ""}`}
                  aria-pressed={allSelected}
                >
                  <span className="test-check">{allSelected ? <Check className="h-4 w-4" aria-hidden /> : null}</span>
                  <span>
                    <strong>{label}</strong>
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
            <div className="test-option-label">
              {siteCopy.customTest.questionsLabel}
              <span className="test-count-value">
                {available === 0 ? "—" : count === null ? `All ${available}` : effectiveCount}
              </span>
            </div>
            <input
              type="range"
              className="test-slider"
              min={1}
              max={sliderMax}
              step={1}
              value={count === null ? sliderMax : Math.min(count, sliderMax)}
              disabled={available === 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCount(v >= sliderMax ? null : v);
              }}
              aria-label="Number of questions"
              aria-valuetext={count === null ? `All ${available} questions` : `${effectiveCount} questions`}
            />
            <div className="test-slider-scale">
              <span>1</span>
              <span>{available || 0}</span>
            </div>
            <div className="test-quick-row">
              {[10, 20, 50].map((n) => (
                <button
                  type="button"
                  key={n}
                  disabled={available < n}
                  onClick={() => setCount(n)}
                  aria-pressed={count === n}
                  className={count === n ? "is-selected" : ""}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={available === 0}
                onClick={() => setCount(null)}
                aria-pressed={count === null}
                className={count === null ? "is-selected" : ""}
              >
                {siteCopy.customTest.allLabel}
              </button>
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
          <div>
            <div className="test-option-label">Draw from</div>
            <div className="test-segment" role="group" aria-label="Which questions to include">
              <button type="button" onClick={() => setSource("all")} aria-pressed={source === "all"} className={source === "all" ? "is-selected" : ""}>
                All
              </button>
              <button type="button" onClick={() => setSource("unseen")} aria-pressed={source === "unseen"} className={source === "unseen" ? "is-selected" : ""}>
                Not yet seen
              </button>
              <button
                type="button"
                onClick={() => setSource("wrong")}
                disabled={wrongInScope === 0}
                aria-pressed={source === "wrong"}
                className={source === "wrong" ? "is-selected" : ""}
              >
                Got wrong{wrongInScope ? ` (${wrongInScope})` : ""}
              </button>
            </div>
          </div>
        <p className="test-option-note">{siteCopy.customTest.sizeNote}</p>
      </section>

      <div className="test-build-bar">
        <div>
          <strong>{chosenUnits.length ? `${chosenUnits.length} units selected` : siteCopy.customTest.emptySelection}</strong>
          <span>
            {available
              ? `${effectiveCount} of ${available} available`
              : chosenUnits.length
              ? "No questions match that filter"
              : siteCopy.customTest.gradeMixHint}
          </span>
        </div>
        {chosenUnits.length > 0 && (
          <button type="button" className="test-clear" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" aria-hidden /> {siteCopy.customTest.clear}
          </button>
        )}
        <button type="button" className="test-start glass-control glass-primary" disabled={!available} onClick={startTest}>
          {siteCopy.customTest.build}
        </button>
      </div>
    </div>
  );
}
