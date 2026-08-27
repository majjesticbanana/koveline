"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cards from "@/content/paper-1.json";
import { useSession } from "@/components/session-provider";
import { readJSON, writeJSON } from "@/lib/storage";

/* ------------------------------------------------------------------ *
 * Paper I revision.
 *
 * Deliberately standalone: it reads its own JSON and keeps its own
 * progress, so it touches neither the content schema nor the deck
 * engine. The questions are images of the real marking schemes rather
 * than text, which the flashcard pipeline has no representation for.
 *
 * Progress key is separate from the unit decks, so clearing one never
 * disturbs the other.
 * ------------------------------------------------------------------ */

type Card = {
  id: string; set: string; year: string; number: number; grade: string;
  q: string; a: string; qw: number; qh: number; aw: number; ah: number;
};

type Rating = "unknown" | "unsure" | "known";
/**
 * Paper I keeps its ratings under the same identity scoping the decks use, so
 * two students sharing a laptop never see each other's marks, and signing in
 * moves you off the signed-out bucket.
 */
const scope = (who: string | null) =>
  who ? `koveline:v3:u:${who}:paper1` : "koveline:v3:paper1";
const orderScope = (who: string | null) => `${scope(who)}:order`;

const RATINGS: { id: Rating; label: string; short: string }[] = [
  { id: "unknown", label: "Don't know", short: "1" },
  { id: "unsure", label: "Unsure", short: "2" },
  { id: "known", label: "Know it", short: "3" },
];

const ALL = "__all__";

export function PaperOne() {
  const { identity } = useSession();
  const all = cards as Card[];
  const sets = useMemo(() => [...new Set(all.map((c) => c.set))], [all]);

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [setFilter, setSetFilter] = useState<string>(ALL);
  const [gradeFilter, setGradeFilter] = useState<string>(ALL);
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<string[]>(() => (cards as Card[]).map((c) => c.id));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  /* ---- restore ---- */
  /* Re-read whenever the identity changes: signing in or out swaps the bucket. */
  useEffect(() => {
    setRatings(readJSON<Record<string, Rating>>(scope(identity)) ?? {});
    setShuffled(readJSON<boolean>(orderScope(identity)) ?? false);
  }, [identity]);

  /* ---- the deck, from the filters ---- */
  const deck = useMemo(() => {
    let d = all;
    if (setFilter !== ALL) d = d.filter((c) => c.set === setFilter);
    if (gradeFilter !== ALL) d = d.filter((c) => c.grade === gradeFilter);
    if (onlyWeak) d = d.filter((c) => ratings[c.id] === "unknown" || ratings[c.id] === "unsure");
    return d;
  }, [all, setFilter, gradeFilter, onlyWeak, ratings]);

  /* Order is held as ids so a shuffle survives re-renders but not a
     filter change, where a stale order would point at absent cards. */
  useEffect(() => {
    const ids = deck.map((c) => c.id);
    if (shuffled) {
      const a = [...ids];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      setOrder(a);
    } else {
      setOrder(ids);
    }
    setIdx(0);
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFilter, gradeFilter, onlyWeak, shuffled]);

  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);
  const current = order.length ? byId.get(order[Math.min(idx, order.length - 1)]) : undefined;

  const counts = useMemo(() => {
    const c = { known: 0, unsure: 0, unknown: 0 };
    for (const card of deck) {
      const r = ratings[card.id];
      if (r) c[r] += 1;
    }
    return c;
  }, [deck, ratings]);

  const rate = useCallback((r: Rating) => {
    if (!current) return;
    setRatings((prev) => {
      const next = { ...prev, [current.id]: r };
      writeJSON(scope(identity), next);
      return next;
    });
    setIdx((i) => Math.min(i + 1, order.length - 1));
    setRevealed(false);
  }, [current, order.length, identity]);

  const go = useCallback((delta: number) => {
    setIdx((i) => Math.max(0, Math.min(i + delta, order.length - 1)));
    setRevealed(false);
  }, [order.length]);

  /* ---- keyboard, matching the unit decks ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "Escape") { setMapOpen(false); return; }
      if (e.key === " ") { e.preventDefault(); revealed ? go(1) : setRevealed(true); return; }
      if (e.key === "ArrowRight") { go(1); return; }
      if (e.key === "ArrowLeft") { go(-1); return; }
      if (!revealed) return;
      if (e.key === "1") rate("unknown");
      if (e.key === "2") rate("unsure");
      if (e.key === "3") rate("known");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, go, rate]);

  useEffect(() => {
    if (!mapOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mapOpen]);

  if (!deck.length || !current) {
    return (
      <div className="p1-empty">
        <p>Nothing matches those filters.</p>
        <button type="button" className="p1-btn" onClick={() => { setSetFilter(ALL); setGradeFilter(ALL); setOnlyWeak(false); }}>
          Clear filters
        </button>
      </div>
    );
  }

  const rated = counts.known + counts.unsure + counts.unknown;
  const pct = deck.length ? Math.round((rated / deck.length) * 100) : 0;

  return (
    <div className="p1">
      {/* ---- filters ---- */}
      <div className="p1-filters">
        <label>
          <span>Paper</span>
          <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)}>
            <option value={ALL}>All papers</option>
            {sets.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          <span>Grade</span>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value={ALL}>Both</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setOnlyWeak((v) => !v)}
          aria-pressed={onlyWeak}
          className={`p1-chip ${onlyWeak ? "is-on" : ""}`}
        >
          Only what I don&apos;t know
        </button>
        <button
          type="button"
          onClick={() => { const v = !shuffled; setShuffled(v); writeJSON(orderScope(identity), v); }}
          aria-pressed={shuffled}
          className={`p1-chip ${shuffled ? "is-on" : ""}`}
        >
          Shuffle
        </button>
      </div>

      {/* ---- status ---- */}
      <div className="p1-status">
        <button type="button" className="p1-count" onClick={() => setMapOpen(true)}>
          Question <b>{idx + 1}</b> / {order.length}
        </button>
        <span className="p1-tag t-known">{counts.known}</span>
        <span className="p1-tag t-unsure">{counts.unsure}</span>
        <span className="p1-tag t-unknown">{counts.unknown}</span>
      </div>
      <div className="p1-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </div>

      {/* ---- the card ---- */}
      <article className="p1-card">
        <header>
          <span className="p1-meta">
            {current.set} · Question {current.number}
            {current.grade ? ` · Grade ${current.grade}` : ""}
          </span>
          {ratings[current.id] && (
            <span className={`p1-dot d-${ratings[current.id]}`} aria-label={`marked ${ratings[current.id]}`} />
          )}
        </header>

        {/* Scans are black on white, so they sit on a paper panel rather
            than the dark page — same split the rest of the site uses. */}
        <div className="p1-paper">
          <img src={current.q} width={current.qw} height={current.qh} alt={`Question ${current.number}`} />
        </div>

        {revealed ? (
          <>
            <div className="p1-answer-label">Marking scheme</div>
            <div className="p1-paper p1-answer">
              <img src={current.a} width={current.aw} height={current.ah} alt="Answer" loading="lazy" />
            </div>
            <div className="p1-rate">
              {RATINGS.map((r) => (
                <button key={r.id} type="button" className={`p1-rate-btn r-${r.id}`} onClick={() => rate(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button type="button" className="p1-reveal" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
        )}
      </article>

      <div className="p1-nav">
        <button type="button" onClick={() => go(-1)} disabled={idx === 0}>← Previous</button>
        <button type="button" onClick={() => go(1)} disabled={idx >= order.length - 1}>Next →</button>
      </div>

      <p className="p1-keys">
        <kbd>Space</kbd> reveal / next · <kbd>←</kbd> <kbd>→</kbd> move · <kbd>1</kbd> don&apos;t know ·{" "}
        <kbd>2</kbd> unsure · <kbd>3</kbd> know · progress saves on this device
      </p>

      {/* ---- question map ---- */}
      {mapOpen && (
        <>
          <div className="p1-scrim" onClick={() => setMapOpen(false)} aria-hidden />
          <div className="p1-map" role="dialog" aria-modal="true" aria-label="Jump to a question" ref={mapRef}>
            <div className="p1-map-head">
              <h2>Jump to a question</h2>
              <button type="button" onClick={() => setMapOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="p1-map-grid">
              {order.map((id, i) => {
                const c = byId.get(id)!;
                const r = ratings[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setIdx(i); setRevealed(false); setMapOpen(false); }}
                    className={`p1-map-cell ${i === idx ? "is-cur" : ""} ${r ? `d-${r}` : ""}`}
                    title={`${c.set} · Q${c.number}`}
                  >
                    {c.number}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="p1-reset"
              onClick={() => {
                if (!window.confirm("Clear all Paper I ratings? This can't be undone.")) return;
                setRatings({});
                writeJSON(scope(identity), {});
                setMapOpen(false);
              }}
            >
              Reset Paper I progress
            </button>
          </div>
        </>
      )}
    </div>
  );
}
