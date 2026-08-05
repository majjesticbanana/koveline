"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { HomeSummary } from "@/lib/content/loader";
import { FlightLine, KoelMark } from "@/components/koel";
import {
  readJSON, progressKey, LAST_STUDIED_KEY, type LastStudied, migrateV2Storage,
} from "@/lib/storage";

type Mark = "correct" | "wrong";

/** Reviewed count for a unit — teal on the home page, never red. */
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

  useEffect(() => {
    migrateV2Storage(v2LessonMap);
    const r: Record<string, number> = {};
    for (const c of summary.courses)
      for (const u of c.units) r[u.key] = reviewedCount(u.key, cardIds[u.key] ?? []);
    setReviewed(r);
    setLast(readJSON<LastStudied>(LAST_STUDIED_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primary = summary.courses[0];

  return (
    <main className="mx-auto max-w-[960px] px-[22px] pb-10">
      <section className="pb-12 pt-16 text-center sm:pt-20">
        <div className="mb-7 flex justify-center">
          <span className="relative grid h-[104px] w-[104px] place-items-center rounded-[26px] bg-basalt-2 ring-1 ring-basalt-line">
            <span
              className="absolute -inset-6 -z-10 rounded-full bg-brass/10 blur-2xl"
              aria-hidden
            />
            <KoelMark size={72} className="text-brass" title="The Koveline koel" />
          </span>
        </div>
        <p className="mb-4 font-display text-[0.74rem] font-bold uppercase tracking-[0.16em] text-brass">
          Grade 9 &amp; 10 · Islam
        </p>
        <h1 className="mx-auto max-w-[17ch] font-display text-[clamp(2rem,5.4vw,3.1rem)] font-bold leading-[1.08] tracking-tight text-on-dark">
          Questions worth sitting with.
        </h1>
        <p className="mx-auto mt-4 max-w-[48ch] text-[1.04rem] text-on-dark-dim">
          Study resources from the Maldives — {summary.grand.questions} questions across
          Grade&nbsp;9 and Grade&nbsp;10 Islam.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {primary && (
            <Link
              href={primary.mixedHref}
              className="inline-flex items-center gap-2 rounded-[14px] bg-brass px-6 py-3.5 font-extrabold text-basalt shadow-warm-sm transition hover:bg-brass-deep"
            >
              Start studying <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          <a
            href="#subjects"
            className="inline-flex items-center gap-2 rounded-[14px] border border-basalt-line bg-basalt-2 px-6 py-3.5 font-extrabold text-on-dark transition hover:bg-basalt-3"
          >
            Choose a unit
          </a>
        </div>

        {last && (
          <div className="mt-6 flex justify-center">
            <Link
              href={last.href}
              className="inline-flex items-center gap-2 rounded-full border border-sage/50 bg-sage/15 px-5 py-2 text-[0.9rem] font-bold text-sage-soft transition hover:bg-sage/25"
            >
              <Play className="h-4 w-4" aria-hidden /> Continue: {last.label}
            </Link>
          </div>
        )}
      </section>

      <section id="subjects" className="scroll-mt-20 space-y-6">
        {summary.courses.map((c) => (
          <div
            key={`${c.subjectId}/${c.courseId}`}
            className="rounded-sheet border border-basalt-line bg-basalt-2/70 p-5 sm:p-7"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-display text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brass">
                  Islam
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="font-display text-[1.6rem] font-bold tracking-tight text-on-dark">
                    Grade {c.grade}
                  </h2>
                  {c.titleDhivehi && (
                    <span lang="dv" dir="rtl" className="thaana text-[1.1rem] font-bold text-on-dark-dim">
                      {c.titleDhivehi}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[0.92rem] text-on-dark-dim">
                  {c.totals.questions} questions · {c.totals.units} units ·{" "}
                  {c.totals.lessons} lessons
                </p>
              </div>
              <Link
                href={c.mixedHref}
                className="inline-flex items-center gap-2 rounded-[13px] border border-brass/60 bg-brass/15 px-5 py-2.5 text-[0.92rem] font-extrabold text-brass transition hover:bg-brass hover:text-basalt"
              >
                Study everything · {c.totals.questions}
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {c.units.map((u) => {
                const done = reviewed[u.key] ?? 0;
                const pct = u.questionCount ? Math.round((done / u.questionCount) * 100) : 0;
                return (
                  <Link
                    key={u.key}
                    href={u.href}
                    className="group relative overflow-hidden rounded-card border-b-[3px] border-brass bg-surface p-[20px] text-ink shadow-warm-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                  >

                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[12px] bg-basalt font-display text-[1.15rem] font-bold text-brass"
                        aria-hidden
                      >
                        {String(u.number).padStart(2, "0")}
                      </span>
                      <div className="font-display text-[0.72rem] font-bold uppercase tracking-[0.12em] text-coffee">
                        Unit {u.number}
                      </div>
                      <span className="ml-auto text-[0.78rem] font-semibold text-cocoa">
                        {u.questionCount} Q · {u.lessonCount} L
                      </span>
                    </div>
                    <h3
                      lang="dv"
                      dir="rtl"
                      className="thaana mb-1.5 text-right text-[1.45rem] font-bold leading-[1.6]"
                    >
                      {u.title}
                    </h3>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <span className="font-display text-[0.95rem] font-bold text-coffee-deep">
                        {u.titleEnglish}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 flex-shrink-0 text-brass-deep transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </div>
                    {done > 0 ? (
                      <>
                        <div className="h-[6px] overflow-hidden rounded-full bg-latte">
                          <i
                            className="block h-full rounded-full bg-sage transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1.5 text-[0.76rem] font-semibold text-cocoa">
                          {done} of {u.questionCount} reviewed
                        </div>
                      </>
                    ) : (
                      <div className="text-[0.76rem] font-semibold text-cocoa/75">Not started</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-[0.88rem] text-on-dark-dim">
          Koveline begins with Islam. Other subjects will be added as they are developed.
        </p>
      </section>

      <section className="mt-12 rounded-card border border-dashed border-brass/45 bg-basalt-2/60 p-7 text-center">
        <div className="mb-3 font-display text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brass">
          Where the questions come from
        </div>
        <div lang="dv" dir="rtl" className="thaana mb-0.5 text-[1.12rem] font-bold text-on-dark">
          އިސްކަންދަރު ސްކޫލް - އިސްލާމް ޑިޕާޓްމަންޓް
        </div>
        <div className="text-[0.94rem] font-semibold text-on-dark-dim">
          Iskandhar School — Islam Department
        </div>
        <p className="mx-auto mt-2.5 max-w-[52ch] text-[0.86rem] leading-relaxed text-on-dark-dim">
          Every question and answer comes from the school&apos;s Islam Q&amp;A preparation papers,
          reproduced here as study material. They were not written by the site&apos;s creator.
        </p>
      </section>
    </main>
  );
}
