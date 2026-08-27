"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The paper index.
 *
 * A course whose units are past papers wants a different index from a
 * syllabus course: you pick a year, not a topic. Sorting is offered because
 * the useful order genuinely differs — newest first when you are revising for
 * this year's exam, oldest first when you are working through the lot.
 */
export type PaperEntry = {
  key: string;
  href: string;
  title: string;
  year: string;
  questionCount: number;
  lessonCount: number;
};

type Sort = "newest" | "oldest" | "longest";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "longest", label: "Most questions" },
];

export function PaperList({ papers }: { papers: PaperEntry[] }) {
  const [sort, setSort] = useState<Sort>("newest");

  const sorted = useMemo(() => {
    const a = [...papers];
    if (sort === "newest") a.sort((x, y) => y.year.localeCompare(x.year));
    if (sort === "oldest") a.sort((x, y) => x.year.localeCompare(y.year));
    if (sort === "longest") a.sort((x, y) => y.questionCount - x.questionCount);
    return a;
  }, [papers, sort]);

  return (
    <>
      <div className="paper-sort" role="group" aria-label="Sort papers">
        <span>Sort</span>
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            aria-pressed={sort === s.id}
            className={sort === s.id ? "is-on" : ""}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="paper-grid">
        {sorted.map((p) => (
          <Link key={p.key} href={p.href} className="paper-card">
            <span className="paper-year">{p.title}</span>
            <span className="paper-meta">
              {p.questionCount} questions
              {p.lessonCount > 1 ? ` · ${p.lessonCount} grades` : ""}
            </span>
            <ArrowRight className="paper-arrow h-4 w-4" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  );
}
