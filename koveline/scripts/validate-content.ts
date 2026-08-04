/**
 * Validates everything under content/ against lib/content/schema.ts.
 *
 * Wired into `prebuild`, so a broken lesson reference fails CI instead of
 * shipping a filter that silently returns nothing — which is exactly how the
 * v1 lesson filter died on 250 of 389 questions without anyone noticing.
 *
 * Run: npm run validate
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  Subject,
  Course,
  Unit,
  FlashcardsResource,
  McqResource,
  PaperResource,
  NotesFrontmatter,
  RESOURCE_TYPES,
  type ResourceType,
} from "../lib/content/schema";

const ROOT = "content";

type Level = "error" | "warn";
interface Issue {
  level: Level;
  where: string;
  msg: string;
}
const issues: Issue[] = [];
const err = (where: string, msg: string) => issues.push({ level: "error", where, msg });
const warn = (where: string, msg: string) => issues.push({ level: "warn", where, msg });

const dirs = (p: string) =>
  existsSync(p)
    ? readdirSync(p).filter((d) => !d.startsWith(".") && statSync(join(p, d)).isDirectory())
    : [];

function readJson(path: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    err(path, `unreadable JSON — ${(e as Error).message}`);
    return null;
  }
}

/** Parse with zod and report the first few issues with their field paths. */
function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, where: string): z.infer<T> | null {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const i of r.error.issues.slice(0, 8)) {
    err(where, `${i.path.join(".") || "<root>"}: ${i.message}`);
  }
  if (r.error.issues.length > 8) {
    err(where, `…and ${r.error.issues.length - 8} more schema issue(s)`);
  }
  return null;
}

const RESOURCE_SCHEMA = {
  flashcards: FlashcardsResource,
  mcq: McqResource,
  paper: PaperResource,
  notes: NotesFrontmatter,
} as const;

/* ------------------------------------------------------------------ */

const stats = { subjects: 0, courses: 0, units: 0, resources: 0, items: 0 };
const globalKeys = new Set<string>();

for (const subjectDir of dirs(ROOT)) {
  const sPath = join(ROOT, subjectDir);
  const subject = parse(Subject, readJson(join(sPath, "subject.json")), join(sPath, "subject.json"));
  if (!subject) continue;
  if (subject.id !== subjectDir) {
    err(sPath, `subject.id "${subject.id}" does not match its folder name "${subjectDir}"`);
  }
  stats.subjects++;

  for (const courseDir of dirs(sPath)) {
    const cPath = join(sPath, courseDir);
    const cFile = join(cPath, "course.json");
    if (!existsSync(cFile)) {
      err(cPath, "missing course.json");
      continue;
    }
    const course = parse(Course, readJson(cFile), cFile);
    if (!course) continue;
    if (course.id !== courseDir) {
      err(cPath, `course.id "${course.id}" does not match its folder name "${courseDir}"`);
    }
    if (course.subjectId !== subject.id) {
      err(cFile, `subjectId "${course.subjectId}" does not match parent subject "${subject.id}"`);
    }
    stats.courses++;

    const unitDirs = dirs(cPath);
    if (unitDirs.length === 0 && !course.draft) {
      warn(cPath, "course has no units and is not marked draft — it will render empty");
    }

    const unitNumbers = new Set<number>();

    for (const unitDir of unitDirs) {
      const uPath = join(cPath, unitDir);
      const uFile = join(uPath, "unit.json");
      if (!existsSync(uFile)) {
        err(uPath, "missing unit.json");
        continue;
      }
      const unit = parse(Unit, readJson(uFile), uFile);
      if (!unit) continue;
      if (unit.id !== unitDir) {
        err(uPath, `unit.id "${unit.id}" does not match its folder name "${unitDir}"`);
      }
      if (unitNumbers.has(unit.number)) {
        err(uFile, `duplicate unit number ${unit.number} within ${courseDir}`);
      }
      unitNumbers.add(unit.number);
      stats.units++;

      // lesson ids must be unique, and numbering should be contiguous
      const lessonIds = new Set<string>();
      for (const l of unit.lessons) {
        if (lessonIds.has(l.id)) err(uFile, `duplicate lesson id "${l.id}"`);
        lessonIds.add(l.id);
      }
      const nums = unit.lessons.map((l) => l.number).sort((a, b) => a - b);
      if (nums.some((n, i) => n !== i + 1)) {
        warn(uFile, `lesson numbers are not contiguous 1..${unit.lessons.length}`);
      }

      const usedLessons = new Set<string>();
      const resourceIds = new Set<string>();

      for (const file of readdirSync(uPath)) {
        if (file === "unit.json") continue;

        let type: ResourceType | null = null;
        let data: unknown = null;
        const fPath = join(uPath, file);

        if (file.endsWith(".json")) {
          data = readJson(fPath);
          const t = (data as { type?: string })?.type;
          if (!t || !RESOURCE_TYPES.includes(t as ResourceType)) {
            err(fPath, `missing or unknown "type" (expected one of ${RESOURCE_TYPES.join(", ")})`);
            continue;
          }
          type = t as ResourceType;
        } else if (file.endsWith(".md")) {
          const raw = readFileSync(fPath, "utf8");
          const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
          if (!m) {
            err(fPath, "markdown resource has no YAML frontmatter block");
            continue;
          }
          data = parseFrontmatter(m[1]);
          type = "notes";
        } else {
          warn(fPath, "unrecognised file in unit folder — ignored");
          continue;
        }

        const res = parse(RESOURCE_SCHEMA[type], data, fPath);
        if (!res) continue;
        stats.resources++;

        if (resourceIds.has(res.id)) err(fPath, `duplicate resource id "${res.id}" in this unit`);
        resourceIds.add(res.id);

        const key = `${subject.id}/${course.id}/${unit.id}/${res.id}`;
        if (globalKeys.has(key)) err(fPath, `duplicate resource key "${key}"`);
        globalKeys.add(key);

        // ---- per-type reference checks ----
        const checkLesson = (lid: string, itemId: string) => {
          if (!lessonIds.has(lid)) {
            err(fPath, `${itemId}: lessonId "${lid}" does not exist in ${unit.id}`);
          } else {
            usedLessons.add(lid);
          }
        };

        if (res.type === "flashcards") {
          const seen = new Set<string>();
          for (const c of res.cards) {
            if (seen.has(c.id)) err(fPath, `duplicate card id "${c.id}"`);
            seen.add(c.id);
            checkLesson(c.lessonId, c.id);
          }
          stats.items += res.cards.length;
        } else if (res.type === "mcq") {
          const seen = new Set<string>();
          for (const q of res.questions) {
            if (seen.has(q.id)) err(fPath, `duplicate question id "${q.id}"`);
            seen.add(q.id);
            checkLesson(q.lessonId, q.id);
            const choiceIds = new Set(q.choices.map((c) => c.id));
            if (choiceIds.size !== q.choices.length) {
              err(fPath, `${q.id}: duplicate choice ids`);
            }
            if (!choiceIds.has(q.correct)) {
              err(fPath, `${q.id}: correct "${q.correct}" is not one of its choices`);
            }
          }
          stats.items += res.questions.length;
        } else if (res.type === "paper") {
          const seen = new Set<string>();
          let n = 0;
          for (const s of res.sections) {
            for (const q of s.questions) {
              if (seen.has(q.id)) err(fPath, `duplicate question id "${q.id}"`);
              seen.add(q.id);
              if (q.lessonId) checkLesson(q.lessonId, q.id);
              n++;
            }
          }
          const declared = res.totalMarks;
          const summed = res.sections
            .flatMap((s) => s.questions)
            .reduce((t, q) => t + (q.marks ?? 0), 0);
          if (declared && summed && declared !== summed) {
            warn(fPath, `totalMarks ${declared} does not match summed marks ${summed}`);
          }
          stats.items += n;
        } else if (res.type === "notes") {
          for (const lid of res.lessonIds) checkLesson(lid, res.id);
        }
      }

      if (resourceIds.size === 0 && !unit.draft) {
        warn(uPath, "unit has no resources and is not marked draft");
      }

      // A lesson nothing references is usually a typo or an unfinished import.
      for (const l of unit.lessons) {
        if (!usedLessons.has(l.id) && resourceIds.size > 0) {
          warn(uFile, `lesson "${l.id}" (${l.title}) is referenced by no resource`);
        }
      }
    }
  }
}

/** Minimal frontmatter reader: scalars and inline `[a, b]` arrays. */
function parseFrontmatter(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of src.split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, k, rawV] = m;
    let v: unknown = rawV.trim().replace(/^["']|["']$/g, "");
    if (/^\[.*\]$/.test(rawV.trim())) {
      v = rawV
        .trim()
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (v === "true" || v === "false") {
      v = v === "true";
    } else if (v !== "" && !isNaN(Number(v))) {
      v = Number(v);
    }
    out[k] = v;
  }
  return out;
}

/* ------------------------------------------------------------------ */

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const i of issues) {
  console.log(`${i.level === "error" ? "ERROR" : " warn"}  ${i.where}\n         ${i.msg}`);
}

console.log(
  `\n${stats.subjects} subject(s), ${stats.courses} course(s), ${stats.units} unit(s), ` +
    `${stats.resources} resource(s), ${stats.items} item(s)`,
);
console.log(`${errors.length} error(s), ${warns.length} warning(s)`);

if (errors.length) process.exit(1);
