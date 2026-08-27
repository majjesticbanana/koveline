"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Eye, Play } from "lucide-react";
import type { DailyQuestion, HomeSummary } from "@/lib/content/loader";
import { HeroFlightLine, KoelMark } from "@/components/koel";
import { RichBody } from "@/components/deck/rich-body";
import { isRtl } from "@/lib/rtl";
import siteCopy from "@/content/site-copy.json";
import {
  readJSON, progressKey, lastStudiedKey, type Identity, type LastStudied, migrateV2Storage,
} from "@/lib/storage";
import { useSession } from "@/components/session-provider";

type Mark = "correct" | "wrong";

function reviewedCount(key: string, validIds: string[], who: Identity): number {
  const s = readJSON<{ status?: Record<string, Mark> }>(progressKey(key, who))?.status ?? {};
  const ok = new Set(validIds);
  return Object.keys(s).filter((id) => ok.has(id)).length;
}

function QuestionOfTheDay({ qotd }: { qotd: DailyQuestion }) {
  const [revealed, setRevealed] = useState(false);
  const rtl = qotd.card.lang ? qotd.card.lang !== "en" : isRtl(qotd.card.front);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", timeZone: "Indian/Maldives",
  }).format(new Date(`${qotd.dateKey}T12:00:00+05:00`));

  return (
    <section className="qotd-section" aria-labelledby="qotd-title">
      <div className="qotd-meta-row">
        <div>
          <div className="qotd-kicker">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {siteCopy.home.questionOfTheDay.label}
          </div>
          <h2 id="qotd-title" className="qotd-heading">{siteCopy.home.questionOfTheDay.heading}</h2>
        </div>
        <span className="qotd-date">{dateLabel}</span>
      </div>

      <div className={`qotd-card ${revealed ? "is-revealed" : ""}`}>
        <div className="qotd-source">
          Grade {qotd.grade} · Unit {qotd.unitNumber} · {qotd.unitTitleEnglish}
        </div>
        {qotd.card.context && (
          <p lang="dv" dir="rtl" className="thaana qotd-context">{qotd.card.context}</p>
        )}
        <p
          lang={rtl ? (qotd.card.lang ?? "dv") : qotd.card.lang}
          dir={rtl ? "rtl" : "ltr"}
          className={`${rtl ? "thaana" : ""} qotd-question`}
        >
          {qotd.card.front}
        </p>

        {!revealed ? (
          <button type="button" onClick={() => setRevealed(true)} className="qotd-reveal glass-control">
            <Eye className="h-4 w-4" aria-hidden /> {siteCopy.home.questionOfTheDay.revealAnswer}
          </button>
        ) : (
          <div className="qotd-answer" aria-live="polite">
            <div className="qotd-answer-label">{siteCopy.home.questionOfTheDay.answerLabel}</div>
            <RichBody body={qotd.card.back} size="sm" />
          </div>
        )}

        <div className="qotd-foot">
          <span lang="dv" dir="rtl" className="thaana">{qotd.lesson?.title ?? qotd.unitTitle}</span>
          <Link href={qotd.href}>{siteCopy.home.questionOfTheDay.studyUnit} <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
        </div>
      </div>
    </section>
  );
}

export function Home({
  summary, cardIds, v2LessonMap, qotd,
}: {
  summary: HomeSummary;
  cardIds: Record<string, string[]>;
  v2LessonMap: Record<string, Record<string, string>>;
  qotd: DailyQuestion | null;
}) {
  const { identity, syncStamp, loading: sessionLoading } = useSession();
  const [reviewed, setReviewed] = useState<Record<string, number>>({});
  const [last, setLast] = useState<LastStudied | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Re-reads whenever the session settles, the signed-in student changes, or
  // saved progress has just been pulled down — the home page must show *this*
  // student's counts, never whoever used the browser before them.
  useEffect(() => {
    if (sessionLoading) return;
    migrateV2Storage(v2LessonMap);
    const r: Record<string, number> = {};
    for (const c of summary.courses)
      for (const u of c.units) r[u.key] = reviewedCount(u.key, cardIds[u.key] ?? [], identity);
    setReviewed(r);
    setLast(readJSON<LastStudied>(lastStudiedKey(identity)));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, identity, syncStamp]);

  return (
    <main className="mx-auto max-w-[980px] px-5 pb-10">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-hero-kicker">{siteCopy.home.hero.kicker}</p>
          <h1 className="home-hero-title">{siteCopy.home.hero.title}</h1>
          <div className="home-hero-actions">
            {loaded && last ? (
              <Link
                href={last.href}
                className="glass-control glass-primary inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold transition duration-200 hover:-translate-y-px"
              >
                <Play className="h-4 w-4" aria-hidden /> {siteCopy.home.hero.continuePrefix} {last.label}
              </Link>
            ) : (
              <a
                href="#subjects"
                className="glass-control glass-primary inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold transition duration-200 hover:-translate-y-px"
              >
                {siteCopy.home.hero.startStudying} <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            )}
            <a
              href="#subjects"
              className="glass-control inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold text-coffee-deep transition hover:border-teal/70 hover:-translate-y-px"
            >
              {siteCopy.home.hero.chooseUnit}
            </a>
          </div>
        </div>

        <div className="home-hero-art" aria-hidden>
          <div className="home-hero-orbit">
            <i />
            <i />
          </div>
          <KoelMark size={150} className="home-hero-mark" />
          <HeroFlightLine className="home-hero-flight" />
          <div className="home-hero-stat glass-panel">
            <strong>{summary.grand.questions}</strong>
            <span>{siteCopy.home.hero.questionStat}</span>
          </div>
        </div>
      </section>

      {qotd && <QuestionOfTheDay qotd={qotd} />}

      {/* ---- grade chapters (Sol #5): rules + whitespace, not cards-in-cards ---- */}
      <div id="subjects" className="scroll-mt-20">
        {summary.grades.map((c, ci) => (
          <section key={`${c.subjectId}/${c.courseId}`} className={ci > 0 ? "mt-14" : ""}>
            <div className="border-t border-line pt-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-teal-deep">
                    Grade {String(c.grade).padStart(2, "0")} / Islam
                  </div>
                  {c.titleDhivehi && (
                    <h2 lang="dv" dir="rtl" className="thaana mt-1 text-[1.7rem] font-bold leading-snug">
                      {c.titleDhivehi}
                    </h2>
                  )}
                  <p className="mt-0.5 text-[0.9rem] text-cocoa">
                    {c.totals.questions} questions · {c.totals.units} units · {c.totals.lessons} lessons
                  </p>
                </div>
                <Link
                  href={c.mixedHref}
                  className="glass-control inline-flex items-center gap-1.5 rounded-ctl border px-4 py-2 text-[0.88rem] font-bold text-teal-deep transition hover:border-teal/70"
                >
                  Study everything · {c.totals.questions}
                </Link>
              </div>

              {/* unit index entries (Sol #3, #4, #2, #32) */}
              <div className="grid gap-3 sm:grid-cols-2">
                {c.units.map((u) => {
                  const done = reviewed[u.key] ?? 0;
                  const pct = u.questionCount ? Math.round((done / u.questionCount) * 100) : 0;
                  const complete = done >= u.questionCount && u.questionCount > 0;
                  return (
                    <Link
                      key={u.key}
                      href={u.href}
                      className="unit-motion group relative overflow-hidden rounded-card border border-line bg-surface px-5 py-4 hover:border-line-strong hover:bg-hover"
                    >
                      {/* oversized margin number, low contrast (Sol #4) */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-3 left-2 select-none font-display text-[4.2rem] font-extrabold leading-none text-latte"
                      >
                        {String(u.number).padStart(2, "0")}
                      </span>
                      <div className="relative">
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-cocoa">
                            Unit {u.number}
                          </span>
                          <span className="text-[0.78rem] font-semibold text-cocoa">
                            {u.questionCount} questions · {u.lessonCount} lessons
                          </span>
                        </div>
                        <h3 lang="dv" dir="rtl" className="thaana text-right text-[1.4rem] font-bold leading-[1.7]">
                          {u.title}
                        </h3>
                        <div className="mt-1 flex items-baseline justify-between gap-3">
                          <span className="font-display text-[0.9rem] font-semibold text-coffee">
                            {u.titleEnglish}
                          </span>
                          <ArrowRight
                            className="h-4 w-4 flex-shrink-0 text-caramel transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </div>
                        {/* progress only once it exists (Sol #2) */}
                        {done > 0 && (
                          <div className="mt-3">
                            {complete ? (
                              <span className="text-[0.76rem] font-bold text-teal-deep">Complete</span>
                            ) : (
                              <>
                                <div className="h-[3px] overflow-hidden rounded-full bg-raised">
                                  <i
                                    className="block h-full rounded-full bg-teal transition-[width] duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-[0.74rem] font-semibold text-cocoa">
                                  {done} / {u.questionCount} reviewed
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          </section>
        ))}

        {/* ---- collections: courses that are not a single school grade ---- */}
        {summary.collections.map((col) => (
          <section key={col.id} className="mt-14">
            <div className="border-t border-line pt-8">
              <div className="mb-6">
                <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-teal-deep">
                  {col.title}
                </div>
                {col.titleDhivehi && (
                  <h2 lang="dv" dir="rtl" className="thaana mt-1 text-[1.7rem] font-bold leading-snug">
                    {col.titleDhivehi}
                  </h2>
                )}
                <p className="mt-0.5 text-[0.9rem] text-cocoa">
                  {col.totals.questions > 0
                    ? `${col.totals.questions} questions · ${col.courses.length} sets`
                    : `${col.courses.length} sets · being prepared`}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {col.courses.map((c) => {
                  const ready = c.totals.questions > 0;
                  const inner = (
                    <>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-cocoa">
                          {c.scopeLabel}
                        </span>
                        {ready && (
                          <span className="text-[0.78rem] font-semibold text-cocoa">
                            {c.totals.questions} questions
                          </span>
                        )}
                      </div>
                      {c.titleDhivehi && (
                        <h3 lang="dv" dir="rtl" className="thaana text-right text-[1.3rem] font-bold leading-[1.7]">
                          {c.titleDhivehi}
                        </h3>
                      )}
                      <div className="mt-1 flex items-baseline justify-between gap-3">
                        <span className="font-display text-[0.9rem] font-semibold text-coffee">
                          {c.title}
                        </span>
                        {ready ? (
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-caramel" aria-hidden />
                        ) : (
                          <span className="text-[0.74rem] font-semibold text-cocoa/70">Soon</span>
                        )}
                      </div>
                    </>
                  );
                  return ready ? (
                    <Link
                      key={c.courseId}
                      href={`/${c.subjectId}/${c.courseId}`}
                      className="group rounded-card border border-line bg-surface px-5 py-4 transition-colors hover:border-line-strong hover:bg-hover"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={c.courseId}
                      className="rounded-card border border-dashed border-line bg-surface/50 px-5 py-4 opacity-70"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ---- provenance, quiet (Sol #17); no personal note (owner ruling) ---- */}
      <section className="mt-14 border-l-2 border-line-strong py-1 pl-5">
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cocoa">
          {siteCopy.home.sourceMaterial.label}
        </div>
        <div lang="dv" dir="rtl" className="thaana mt-1.5 w-fit text-[1.05rem] font-bold">
          {siteCopy.home.sourceMaterial.nameDhivehi}
        </div>
        <div className="text-[0.9rem] font-semibold text-coffee">{siteCopy.home.sourceMaterial.nameEnglish}</div>
        <p className="mt-1.5 max-w-[58ch] text-[0.84rem] leading-relaxed text-cocoa">
          {siteCopy.home.sourceMaterial.note}
        </p>
      </section>
    </main>
  );
}
