"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Flashcard, Lesson, RichBodyT } from "@/lib/content/schema";
import { isRtl } from "@/lib/rtl";
import {
  readJSON, writeJSON, progressKey, rememberLastStudied, migrateV2Storage,
} from "@/lib/storage";
import { ChevronDown } from "lucide-react";
import { RichBody } from "./rich-body";
import {
  type Mode, type Mark, type Tone,
  ModeBar, StatBar, ProgressBar, KbdHints, BottomSheet, NavLegend,
  ContextLine, sheetShell, CompleteCard, RevealButton, MarkButtons, NextButton,
  MobileActionBar,
} from "./ui";

/** One deck engine for every flashcard surface — unit decks and the mixed deck. */

export interface DeckCard extends Flashcard {
  /** Present on mixed-deck cards: which unit this card came from. */
  unitBadge?: { number: number; titleEnglish: string; lessonTitle?: string };
}

export interface DeckProps {
  cards: DeckCard[];
  /** Lessons for the filter; empty array disables the filter (mixed deck). */
  lessons: Lesson[];
  /** e.g. islam/grade-9/unit-1/flashcards */
  storageKey: string;
  lastStudied: { href: string; label: string };
  /** unit-id -> lesson-title -> lesson-id, for the one-time v2 migration. */
  v2LessonMap: Record<string, Record<string, string>>;
}

type Status = Record<string, Mark>;

interface Saved {
  status?: Status;
  mode?: Mode;
  idx?: number;
  lessonId?: string;
  orderIds?: string[];
}

const ALL = "__all__";

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function DeckEngine({ cards, lessons, storageKey, lastStudied, v2LessonMap }: DeckProps) {
  const KEY = progressKey(storageKey);

  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("sequential");
  const [lessonId, setLessonId] = useState<string>(ALL);
  const [status, setStatus] = useState<Status>({});
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [complete, setComplete] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const buildDeck = useCallback(
    (m: Mode, les: string, st: Status): DeckCard[] => {
      let qs = cards;
      if (les !== ALL) qs = qs.filter((c) => c.lessonId === les);
      if (m === "wrongOnly") qs = qs.filter((c) => st[c.id] === "wrong");
      return m === "random" ? shuffle(qs) : qs;
    },
    [cards],
  );

  // load once: migrate v2 storage, then restore
  useEffect(() => {
    migrateV2Storage(v2LessonMap);

    const s = readJSON<Saved>(KEY) ?? {};
    const savedStatus: Status = s.status && typeof s.status === "object" ? s.status : {};
    const savedMode: Mode =
      s.mode && ["random", "sequential", "wrongOnly"].includes(s.mode) ? s.mode : "sequential";
    const savedLesson =
      typeof s.lessonId === "string" &&
      (s.lessonId === ALL || lessons.some((l) => l.id === s.lessonId))
        ? s.lessonId
        : ALL;

    // restore exact order (matters in random mode) — but only if it still
    // covers the full current deck, so newly added cards are never hidden
    let d: DeckCard[] | null = null;
    if (Array.isArray(s.orderIds) && s.orderIds.length > 0) {
      const byId = new Map(cards.map((c) => [c.id, c]));
      const restored = s.orderIds.map((id) => byId.get(id)).filter(Boolean) as DeckCard[];
      const expected = buildDeck(savedMode, savedLesson, savedStatus).length;
      if (restored.length === s.orderIds.length && restored.length === expected) d = restored;
    }
    if (!d) d = buildDeck(savedMode, savedLesson, savedStatus);

    setStatus(savedStatus);
    setMode(savedMode);
    setLessonId(savedLesson);
    setDeck(d);
    setIdx(Math.min(Math.max(typeof s.idx === "number" ? s.idx : 0, 0), Math.max(d.length - 1, 0)));
    setLoaded(true);
    rememberLastStudied(lastStudied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    if (!loaded) return;
    writeJSON(KEY, {
      status, mode, idx, lessonId, orderIds: deck.map((c) => c.id),
    } satisfies Saved);
  }, [status, mode, idx, lessonId, deck, loaded, KEY]);

  const current = deck[idx];

  const counts = useMemo(() => {
    let c = 0, w = 0;
    deck.forEach((q) => {
      const s = status[q.id];
      if (s === "correct") c++;
      else if (s === "wrong") w++;
    });
    return { c, w, answered: c + w, total: deck.length };
  }, [deck, status]);

  const wrongTotal = useMemo(() => {
    let qs = cards;
    if (lessonId !== ALL) qs = qs.filter((c) => c.lessonId === lessonId);
    return qs.filter((c) => status[c.id] === "wrong").length;
  }, [cards, status, lessonId]);

  const resetView = () => { setIdx(0); setShowAnswer(false); setComplete(false); };

  const changeMode = (m: Mode) => { setMode(m); setDeck(buildDeck(m, lessonId, status)); resetView(); };
  const changeLesson = (les: string) => { setLessonId(les); setDeck(buildDeck(mode, les, status)); resetView(); };

  const mark = useCallback(
    (correct: boolean) => {
      if (!current) return;
      setStatus((s) => ({ ...s, [current.id]: correct ? "correct" : "wrong" }));
    },
    [current],
  );

  const goNext = useCallback(() => {
    if (idx < deck.length - 1) { setIdx((i) => i + 1); setShowAnswer(false); setComplete(false); }
    else setComplete(true);
  }, [idx, deck.length]);

  const goPrev = useCallback(() => {
    if (idx > 0) { setIdx((i) => i - 1); setShowAnswer(false); setComplete(false); }
  }, [idx]);

  const goTo = (i: number) => { setIdx(i); setShowAnswer(false); setComplete(false); setNavOpen(false); };

  const reset = () => {
    setStatus({});
    setMode("sequential");
    setLessonId(ALL);
    setDeck(buildDeck("sequential", ALL, {}));
    resetView();
  };

  // keyboard
  useEffect(() => {
    if (!loaded || complete || navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (showAnswer) goNext();
        else setShowAnswer(true);
      } else if (e.code === "ArrowRight" && idx < deck.length - 1) goNext();
      else if (e.code === "ArrowLeft") goPrev();
      else if (showAnswer && (e.key === "r" || e.key === "R" || e.key === "1")) mark(true);
      else if (showAnswer && (e.key === "w" || e.key === "W" || e.key === "2")) mark(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded, complete, navOpen, showAnswer, idx, deck.length, goNext, goPrev, mark]);

  if (!loaded) {
    return (
      <div className="grid min-h-[200px] place-items-center rounded-panel border border-line bg-surface">
        <p className="text-cocoa">Loading your progress…</p>
      </div>
    );
  }

  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  const lessonFilter = lessons.length > 1 && (
    <div className="mb-4 flex items-center justify-center gap-2.5">
      <label
        htmlFor="lesson-filter"
        className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-cocoa"
      >
        Lesson
      </label>
      <div className="relative min-w-0 max-w-[420px] flex-1 sm:flex-initial sm:w-[380px]">
        <select
          id="lesson-filter"
          value={lessonId}
          onChange={(e) => changeLesson(e.target.value)}
          lang="dv"
          dir="rtl"
          className="thaana w-full cursor-pointer appearance-none truncate rounded-ctl border border-line bg-surface py-2.5 pe-3.5 ps-9 text-right text-[1rem] font-semibold leading-tight text-coffee-deep transition hover:border-caramel"
        >
          <option value={ALL}>ހުރިހާ ފިލާވަޅެއް ({cards.length})</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({cards.filter((c) => c.lessonId === l.id).length})
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-caramel [inset-inline-start:12px]"
          aria-hidden
        />
      </div>
    </div>
  );

  const navigator = (
    <BottomSheet
      open={navOpen}
      onClose={() => setNavOpen(false)}
      title="Jump to a question"
      subtitle={<>{deck.length} questions · {counts.answered} answered</>}
    >
      <div className="grid gap-[9px] [grid-template-columns:repeat(auto-fill,minmax(54px,1fr))]">
        {deck.map((q, i) => {
          const s = status[q.id];
          const isCur = i === idx;
          const cls = isCur
            ? "bg-teal border-teal text-white"
            : s === "correct"
            ? "bg-green-bg border-green-line text-green"
            : s === "wrong"
            ? "bg-red-bg border-red-line text-red"
            : "bg-cream border-line text-cocoa hover:border-caramel";
          return (
            <button
              key={q.id}
              onClick={() => goTo(i)}
              aria-label={`Question ${i + 1}${s ? ` — marked ${s}` : ""}`}
              aria-current={isCur ? "true" : undefined}
              className={`grid aspect-square place-items-center rounded-[11px] border font-display text-[0.95rem] font-bold transition-transform hover:-translate-y-0.5 ${cls}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <NavLegend />
    </BottomSheet>
  );

  if (deck.length === 0) {
    // any empty deck — wrong-only with nothing to review, or a lesson that
    // (through a data error) has no cards. Never render a blank sheet.
    const isReview = mode === "wrongOnly";
    return (
      <div>
        {lessonFilter}
        <ModeBar mode={mode} wrongTotal={wrongTotal} onMode={changeMode} onReset={reset} />
        <div className="rounded-panel border border-line bg-surface p-9 text-center">
          <h3 className="mb-2 font-display text-2xl font-extrabold">
            {isReview ? "Nothing to review" : "No questions here yet"}
          </h3>
          <p className="mb-6 text-cocoa">
            {isReview
              ? "You haven't marked anything wrong. Go through the deck first."
              : "Pick another lesson, or study the whole unit."}
          </p>
          <button
            onClick={() => (isReview ? changeMode("sequential") : changeLesson(ALL))}
            className="rounded-ctl bg-teal px-6 py-3 font-bold text-white transition hover:bg-teal-deep"
          >
            {isReview ? "Start the deck" : "Show all questions"}
          </button>
        </div>
        {navigator}
      </div>
    );
  }

  if (complete) {
    return (
      <div>
        <CompleteCard
          correct={counts.c}
          wrong={counts.w}
          total={deck.length}
          onReviewWrong={() => changeMode("wrongOnly")}
          onRestart={reset}
          homeHref="/#subjects"
        />
        {navigator}
      </div>
    );
  }

  const st = current ? status[current.id] : undefined;
  const tone: Tone = st === "correct" ? "correct" : st === "wrong" ? "wrong" : "";
  const qRtl = current ? isRtl(current.front) : false;
  const lesson = current ? lessonById.get(current.lessonId) : undefined;

  return (
    <div>
      {lessonFilter}

      <StatBar
        index={idx + 1}
        total={deck.length}
        correct={counts.c}
        wrong={counts.w}
        onOpenNav={() => setNavOpen(true)}
      />
      <ProgressBar correct={counts.c} wrong={counts.w} total={deck.length} />
      <ModeBar mode={mode} wrongTotal={wrongTotal} onMode={changeMode} onReset={reset} />

      <div className={sheetShell(tone)}>
        <ContextLine
          tone={tone}
          index={idx + 1}
          total={deck.length}
          unitLabel={current?.unitBadge ? `Unit ${current.unitBadge.number} · ${current.unitBadge.titleEnglish}` : undefined}
          lessonTitle={current?.unitBadge?.lessonTitle ?? lesson?.title}
        />

        <div className="px-5 py-5 sm:px-6">
          {current?.context && (
            <div
              dir="rtl"
              lang="dv"
              className="thaana mb-3 rounded-ctl border border-dashed border-line bg-cream/70 px-4 py-2.5 text-[0.95rem] leading-relaxed text-cocoa"
            >
              {current.context}
            </div>
          )}

          <div
            dir={qRtl ? "rtl" : "ltr"}
            lang={qRtl ? "dv" : undefined}
            className={`${qRtl ? "thaana" : ""} text-[1.35rem] font-semibold leading-relaxed sm:text-[1.45rem]`}
          >
            {current?.front}
          </div>

          <span className={`annotate mt-3 ${showAnswer ? "swept" : ""}`} aria-hidden />

          {showAnswer && current && (
            <div className="mt-4 animate-rise border-t border-line pt-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-teal-deep">
                  Answer
                </span>
                <span lang="dv" dir="rtl" className="thaana text-[0.82rem] font-bold text-teal-deep">
                  ޖަވާބު
                </span>
              </div>
              <AnswerBody body={current.back} />
            </div>
          )}

          <div className="hidden sm:block">
            {!showAnswer ? (
              <RevealButton onClick={() => setShowAnswer(true)} />
            ) : (
              <>
                <MarkButtons status={st} onMark={mark} />
                {st && <NextButton isLast={idx >= deck.length - 1} onClick={goNext} />}
              </>
            )}
          </div>
          <div className="h-2 sm:hidden" />
        </div>
      </div>

      {/* sticky action area on phones (Sol #25) */}
      {!navOpen && (
        <MobileActionBar>
          {!showAnswer ? (
            <RevealButton onClick={() => setShowAnswer(true)} />
          ) : !st ? (
            <MarkButtons status={st} onMark={mark} />
          ) : (
            <NextButton isLast={idx >= deck.length - 1} onClick={goNext} />
          )}
        </MobileActionBar>
      )}
      <div className="h-24 sm:hidden" aria-hidden />

      <KbdHints />
      {navigator}
    </div>
  );
}

function AnswerBody({ body }: { body: RichBodyT }) {
  return <RichBody body={body} />;
}
