/**
 * One-time migration: data/grade9-islam/*.json  ->  content/islam/grade-9/**
 *
 * Fixes carried out here so they never have to be done by hand:
 *   1. Lesson references become real ids (`l3`) instead of free strings.
 *      In unit1-3 the question's `lesson` field was "ފިލާވަޅު N" while the
 *      declared `lessons[]` held descriptive titles, so nothing ever matched.
 *      N maps positionally onto lessons[N-1]; verified against question content.
 *   2. Unit ids normalise: "unit1" and "grade9-islam-unit4" both -> "unit-4".
 *   3. Answers become a tagged RichBody union instead of string|string[]|object.
 *   4. Definitions are dropped entirely (AI-generated, unsourced).
 *
 * Run: node scripts/migrate-v1.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "data/grade9-islam";
const OUT = "content/islam/grade-9";

const ICONS = ["🕌", "📖", "⚖️", "🏛️", "🌙", "🤝"];
const LESSON_NUM = /^\s*ފިލާވަޅު\s*(\d+)\s*$/;

const report = { units: [], warnings: [] };

/** string | string[] | Record<string, unknown>  ->  RichBody */
function toRichBody(answer, ctx) {
  if (typeof answer === "string") {
    return { kind: "text", value: answer.trim() };
  }
  if (Array.isArray(answer)) {
    const items = answer.map((a) =>
      typeof a === "string" ? a.trim() : JSON.stringify(a),
    );
    if (answer.some((a) => typeof a !== "string")) {
      report.warnings.push(`${ctx}: list contained a non-string item`);
    }
    return { kind: "list", items, ordered: false };
  }
  if (answer && typeof answer === "object") {
    const sections = Object.entries(answer).map(([heading, v]) => ({
      heading: heading.trim(),
      body: Array.isArray(v)
        ? {
            kind: "list",
            items: v.map((x) => (typeof x === "string" ? x.trim() : JSON.stringify(x))),
            ordered: false,
          }
        : { kind: "text", value: String(v).trim() },
    }));
    return { kind: "sections", sections };
  }
  report.warnings.push(`${ctx}: unrecognised answer shape, coerced to text`);
  return { kind: "text", value: String(answer) };
}

function migrateUnit(srcFile, number) {
  const raw = JSON.parse(readFileSync(join(SRC, srcFile), "utf8"));
  const unitId = `unit-${number}`;

  // lessons: string[] -> Lesson[]
  const lessons = raw.lessons.map((title, i) => ({
    id: `l${i + 1}`,
    number: i + 1,
    title: title.trim(),
  }));

  // Build both lookup strategies. Units 1-3 use "ފިލާވަޅު N" (positional);
  // units 4-6 already store the descriptive title verbatim.
  const byTitle = new Map(lessons.map((l) => [l.title, l.id]));

  let positional = 0;
  let byName = 0;
  const unresolved = [];

  const cards = raw.questions.map((q) => {
    const ctx = `${unitId} q${q.id}`;
    let lessonId = null;

    const m = LESSON_NUM.exec(q.lesson ?? "");
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= lessons.length) {
        lessonId = `l${n}`;
        positional++;
      }
    } else if (byTitle.has((q.lesson ?? "").trim())) {
      lessonId = byTitle.get(q.lesson.trim());
      byName++;
    }

    if (!lessonId) {
      unresolved.push({ q: q.id, lesson: q.lesson });
      lessonId = lessons[0].id;
    }

    return {
      id: `q${q.id}`,
      lessonId,
      front: q.question.trim(),
      back: toRichBody(q.answer, ctx),
    };
  });

  const unit = {
    id: unitId,
    number,
    icon: ICONS[number - 1] ?? "📚",
    title: raw.title.trim(),
    titleEnglish: raw.titleEnglish?.trim(),
    description: raw.description?.trim(),
    lessons,
    draft: false,
  };

  const flashcards = {
    type: "flashcards",
    id: "flashcards",
    title: "Flashcards",
    description: `${cards.length} questions across ${lessons.length} lessons.`,
    order: 0,
    draft: false,
    cards,
  };

  const dir = join(OUT, unitId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "unit.json"), JSON.stringify(unit, null, 2) + "\n");
  writeFileSync(join(dir, "flashcards.json"), JSON.stringify(flashcards, null, 2) + "\n");

  // per-lesson counts, for the review table
  const counts = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    n: cards.filter((c) => c.lessonId === l.id).length,
  }));

  report.units.push({
    srcFile,
    oldId: raw.id,
    newId: unitId,
    titleEnglish: raw.titleEnglish,
    cards: cards.length,
    strategy: positional > byName ? "positional" : "by-name",
    positional,
    byName,
    unresolved,
    counts,
  });

  if (unresolved.length) {
    report.warnings.push(
      `${unitId}: ${unresolved.length} question(s) had an unresolvable lesson, defaulted to l1`,
    );
  }
}

/* ---------------- run ---------------- */

mkdirSync(OUT, { recursive: true });

writeFileSync(
  "content/islam/subject.json",
  JSON.stringify(
    {
      id: "islam",
      name: "Islam",
      nameDhivehi: "އިސްލާމް",
      icon: "🕌",
      accent: "coffee",
      order: 1,
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  join(OUT, "course.json"),
  JSON.stringify(
    {
      id: "grade-9",
      subjectId: "islam",
      title: "Grade 9 Islam",
      titleDhivehi: "ގްރޭޑް 9 އިސްލާމް",
      grade: 9,
      contentLang: "dv",
      credit: {
        english: "Iskandhar School — Islam Department",
        dhivehi: "އިސްކަންދަރު ސްކޫލް - އިސްލާމް ޑިޕާޓްމަންޓް",
        note: "All questions come from the school's Islam Q&A papers.",
      },
      order: 1,
      draft: false,
    },
    null,
    2,
  ) + "\n",
);

const FILES = [
  "unit1.json",
  "unit2.json",
  "unit3.json",
  "unit4.json",
  "unit5.json",
  "unit6.json",
];
FILES.forEach((f, i) => migrateUnit(f, i + 1));

if (!existsSync("content/islam/grade-10")) {
  mkdirSync("content/islam/grade-10", { recursive: true });
  writeFileSync(
    "content/islam/grade-10/course.json",
    JSON.stringify(
      {
        id: "grade-10",
        subjectId: "islam",
        title: "Grade 10 Islam",
        titleDhivehi: "ގްރޭޑް 10 އިސްލާމް",
        grade: 10,
        contentLang: "dv",
        order: 2,
        draft: true,
      },
      null,
      2,
    ) + "\n",
  );
}

writeFileSync("scripts/migration-report.json", JSON.stringify(report, null, 2) + "\n");

console.log(`Migrated ${report.units.length} units.`);
for (const u of report.units) {
  console.log(
    `  ${u.oldId.padEnd(22)} -> ${u.newId}  ${String(u.cards).padStart(3)} cards  ` +
      `(${u.strategy}: ${u.positional} positional / ${u.byName} by-name, ${u.unresolved.length} unresolved)`,
  );
}
if (report.warnings.length) {
  console.log("\nWarnings:");
  report.warnings.forEach((w) => console.log("  ! " + w));
} else {
  console.log("\nNo warnings.");
}
