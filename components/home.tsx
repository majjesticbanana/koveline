"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { HomeSummary } from "@/lib/content/loader";
import { HeroFlightLine, KoelMark } from "@/components/koel";
import {
  readJSON, progressKey, LAST_STUDIED_KEY, type LastStudied, migrateV2Storage,
} from "@/lib/storage";

type Mark = "correct" | "wrong";

function reviewedCount(key: string, validIds: string[]): number {
  const s = readJSON<{ status?: Record<string, Mark> }>(progressKey(key))?.status ?? {};
  const ok = new Set(validIds);
  return Object.keys(s).filter((id) => ok.has(id)).length;
}

export function Home({
  summary, cardIds, v2LessonMap,
}: {
  summary: HomeSummary;
  cardIds: Record<string, string[]>;
  v2LessonMap: Record<string, Record<string, string>>;
}) {
  const [reviewed, setReviewed] = useState<Record<string, number>>({});
  const [last, setLast] = useState<LastStudied | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    migrateV2Storage(v2LessonMap);
    const r: Record<string, number> = {};
    for (const c of summary.courses)
      for (const u of c.units) r[u.key] = reviewedCount(u.key, cardIds[u.key] ?? []);
    setReviewed(r);
    setLast(readJSON<LastStudied>(LAST_STUDIED_KEY));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-[980px] px-5 pb-10">
      {/* Hero intentionally carries more visual identity than the content sections below. */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-hero-kicker">Grade 9 &amp; 10 · Islam</p>
          <h1 className="home-hero-title">Questions worth sitting with.</h1>
          <p className="home-hero-body">
            A free learning project made in the Maldives.
            <span className="font-semibold text-coffee"> Study, reveal, self-mark, and return to what you missed.</span>
          </p>

          <div className="home-hero-actions">
            {loaded && last ? (
              <Link
                href={last.href}
                className="glass-control glass-primary inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold transition duration-200 hover:-translate-y-px"
              >
                <Play className="h-4 w-4" aria-hidden /> Continue: {last.label}
              </Link>
            ) : (
              <a
                href="#subjects"
                className="glass-control glass-primary inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold transition duration-200 hover:-translate-y-px"
              >
                Start studying <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            )}
            <a
              href="#subjects"
              className="glass-control inline-flex items-center gap-2 rounded-ctl border px-6 py-3 font-bold text-coffee-deep transition hover:border-teal/70 hover:-translate-y-px"
            >
              Choose a unit
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
            <span>questions across Islam</span>
          </div>
        </div>
      </section>

      {/* ---- grade chapters (Sol #5): rules + whitespace, not cards-in-cards ---- */}
      <div id="subjects" className="scroll-mt-20">
        {summary.courses.map((c, ci) => (
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
                      data-tilt="" className="unit-motion group relative overflow-hidden rounded-card border border-line bg-surface px-5 py-4 hover:border-line-strong hover:bg-hover"
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
      </div>

      {/* ---- provenance, quiet (Sol #17); no personal note (owner ruling) ---- */}
      <section className="mt-14 border-l-2 border-line-strong py-1 pl-5">
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cocoa">
          Source material
        </div>
        <div lang="dv" dir="rtl" className="thaana mt-1.5 w-fit text-[1.05rem] font-bold">
          އިސްކަންދަރު ސްކޫލް - އިސްލާމް ޑިޕާޓްމަންޓް
        </div>
        <div className="text-[0.9rem] font-semibold text-coffee">Iskandhar School — Islam Department</div>
        <p className="mt-1.5 max-w-[58ch] text-[0.84rem] leading-relaxed text-cocoa">
          Every question and answer comes from the school&apos;s Islam Q&amp;A preparation papers,
          reproduced here as study material. They were not written by the site&apos;s creator.
        </p>
      </section>
    </main>
  );
}
