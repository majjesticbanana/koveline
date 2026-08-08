import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Past Papers",
  description: "Past papers on Koveline, organised by grade and year as they are added.",
};

export default function PastPapersPage() {
  return (
    <main className="mx-auto min-h-[68vh] max-w-[900px] px-5 pb-16 pt-12 sm:pt-16">
      <Link href="/" className="inline-flex items-center gap-2 text-[0.84rem] font-semibold text-cocoa transition hover:text-coffee-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Home
      </Link>

      <section className="mt-8 max-w-[650px]">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-caramel">
          <FileText className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-teal-deep">Resources</p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,8vw,4.6rem)] font-extrabold leading-[.95] tracking-[-0.06em]">
          Past Papers
        </h1>
        <p className="mt-5 max-w-[56ch] text-[0.98rem] leading-7 text-cocoa">
          This section is ready for past papers, but none have been added yet. When they are, they can be organised by subject, grade, year, and paper without changing the navigation again.
        </p>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        {["Grade 10", "Grade 9"].map((grade) => (
          <div key={grade} className="rounded-card border border-line bg-surface px-5 py-5 opacity-80">
            <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-cocoa">Past papers</div>
            <h2 className="mt-2 font-display text-xl font-bold">{grade}</h2>
            <p className="mt-1 text-[0.84rem] text-cocoa">No papers added yet.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
