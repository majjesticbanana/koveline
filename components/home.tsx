"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { HomeSummary } from "@/lib/content/loader";
import { FlightLine } from "@/components/koel";
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
      <section className="pb-10 pt-14 text-center sm:pt-16">
        <h1 className="mx-auto max-w-[18ch] font-display text-[clamp(2rem,5.6vw,3.2rem)] font-extrabold leading-[1.1] tracking-tight">
          Questions worth sitting with.
        </h1>
        <div className="mx-auto mt-3 w-[190px]">
          <FlightLine className="h-4 w-full" />
        </div>
        <p className="mx-auto mt-4 max-w-[48ch] text-[1.06rem] font-medium text-cocoa">
          Study resources from the Maldives — {summary.grand.questions} questions across
          Grade&nbsp;9 and Grade&nbsp;10 Islam.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {primary && (
            <Link
              href={primary.mixedHref}
              className="inline-flex items-center gap-2 rounded-[14px] bg-teal px-6 py-3.5 font-extrabold text-white shadow-warm-sm transition hover:bg-teal-deep"
            >
              Start studying <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          <a
            href="#subjects"
            className="inline-flex items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-surface px-6 py-3.5 font-extrabold text-coffee-deep transition hover:border-caramel"
          >
            Choose a unit
          </a>
        </div>

        {last && (
          <div className="mt-5 flex justify-center">
            <Link
              href={last.href}
              className="inline-flex items-center gap-2 rounded-full border border-teal-soft bg-teal-soft/70 px-5 py-2 text-[0.9rem] font-bold text-teal-deep transition hover:-translate-y-0.5 hover:shadow-warm-sm"
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
            className="rounded-[24px] border border-line bg-surface/70 p-5 shadow-warm-sm sm:p-7"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-display text-[0.74rem] font-extrabold uppercase tracking-[0.1em] text-teal-deep">
                  Islam
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight">
                    Grade {c.grade}
                  </h2>
                  {c.titleDhivehi && (
                    <span lang="dv" dir="rtl" className="thaana text-[1.1rem] font-bold text-cocoa">
                      {c.titleDhivehi}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[0.92rem] text-cocoa">
                  {c.totals.questions} questions · {c.totals.units} units ·{" "}
                  {c.totals.lessons} lessons
                </p>
              </div>
              <Link
                href={c.mixedHref}
                className="inline-flex items-center gap-2 rounded-[13px] border-[1.5px] border-teal bg-teal-soft/60 px-5 py-2.5 text-[0.92rem] font-extrabold text-teal-deep transition hover:bg-teal-soft"
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
                    className="group relative overflow-hidden rounded-card border border-line bg-surface p-[20px] transition-all duration-200 hover:-translate-y-[4px] hover:border-caramel hover:shadow-warm"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-teal transition-transform duration-300 group-hover:scale-y-100"
                      aria-hidden
                    />
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[13px] bg-latte text-[1.35rem]"
                        aria-hidden
                      >
                        {u.icon}
                      </span>
                      <div className="font-display text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-teal-deep">
                        Unit {u.number}
                      </div>
                      <span className="ml-auto text-[0.82rem] font-bold text-cocoa">
                        {u.questionCount} questions · {u.lessonCount} lessons
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
                      <span className="font-display text-[0.95rem] font-bold text-coffee">
                        {u.titleEnglish}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 flex-shrink-0 text-caramel transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </div>
                    {done > 0 ? (
                      <>
                        <div className="h-[5px] overflow-hidden rounded-full bg-latte">
                          <i
                            className="block h-full rounded-full bg-teal transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1.5 text-[0.78rem] font-semibold text-cocoa">
                          {done} of {u.questionCount} reviewed
                        </div>
                      </>
                    ) : (
                      <div className="text-[0.78rem] font-semibold text-cocoa/80">Not started</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-[0.88rem] text-cocoa">
          Koveline begins with Islam. Other subjects will be added as they are developed.
        </p>
      </section>

      <section className="mt-12 rounded-card border-[1.5px] border-dashed border-caramel/60 bg-surface/70 p-7 text-center">
        <div className="mb-2.5 font-display text-[0.74rem] font-extrabold uppercase tracking-[0.1em] text-teal-deep">
          Where the questions come from
        </div>
        <div lang="dv" dir="rtl" className="thaana mb-0.5 text-[1.12rem] font-bold">
          އިސްކަންދަރު ސްކޫލް - އިސްލާމް ޑިޕާޓްމަންޓް
        </div>
        <div className="text-[0.94rem] font-semibold text-cocoa">
          Iskandhar School — Islam Department
        </div>
        <p className="mx-auto mt-2.5 max-w-[52ch] text-[0.86rem] leading-relaxed text-cocoa">
          Every question and answer comes from the school&apos;s Islam Q&amp;A preparation papers,
          reproduced here as study material. They were not written by the site&apos;s creator.
        </p>
      </section>
    </main>
  );
}
