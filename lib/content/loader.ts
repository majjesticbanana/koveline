/**
 * Server-only content loader. Reads the content/ tree at build time and
 * validates it against the schema — so a page can never render from data
 * the validator would reject.
 */
import "server-only";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import {
  Subject as SubjectSchema,
  Course as CourseSchema,
  Unit as UnitSchema,
  FlashcardsResource as FlashcardsSchema,
  type Subject,
  type Course,
  type Unit,
  type FlashcardsResource,
  resourceKey,
} from "./schema";

const ROOT = join(process.cwd(), "content");

const dirs = (p: string) =>
  existsSync(p)
    ? readdirSync(p).filter((d) => !d.startsWith(".") && statSync(join(p, d)).isDirectory())
    : [];

const json = (p: string) => JSON.parse(readFileSync(p, "utf8"));

export interface UnitEntry {
  subject: Subject;
  course: Course;
  unit: Unit;
  flashcards: FlashcardsResource;
  /** e.g. /islam/grade-9/unit-1/flashcards */
  href: string;
  /** e.g. islam/grade-9/unit-1/flashcards — progress-storage key */
  key: string;
}

export const loadContent = cache(() => {
  const subjects: Subject[] = [];
  const courses: Course[] = [];
  const units: UnitEntry[] = [];

  for (const sDir of dirs(ROOT)) {
    const subject = SubjectSchema.parse(json(join(ROOT, sDir, "subject.json")));
    subjects.push(subject);

    for (const cDir of dirs(join(ROOT, sDir))) {
      const course = CourseSchema.parse(json(join(ROOT, sDir, cDir, "course.json")));
      courses.push(course);
      if (course.draft) continue;

      for (const uDir of dirs(join(ROOT, sDir, cDir))) {
        const uPath = join(ROOT, sDir, cDir, uDir);
        const unit = UnitSchema.parse(json(join(uPath, "unit.json")));
        if (unit.draft) continue;
        const fcPath = join(uPath, "flashcards.json");
        if (!existsSync(fcPath)) continue;
        const flashcards = FlashcardsSchema.parse(json(fcPath));
        units.push({
          subject,
          course,
          unit,
          flashcards,
          href: `/${subject.id}/${course.id}/${unit.id}/${flashcards.id}`,
          key: resourceKey(subject.id, course.id, unit.id, flashcards.id),
        });
      }
    }
  }

  subjects.sort((a, b) => a.order - b.order);
  courses.sort((a, b) => a.order - b.order);
  units.sort((a, b) => a.unit.number - b.unit.number);
  return { subjects, courses, units };
});

export const getUnitEntry = (subject: string, course: string, unit: string, resource: string) =>
  loadContent().units.find(
    (e) =>
      e.subject.id === subject &&
      e.course.id === course &&
      e.unit.id === unit &&
      e.flashcards.id === resource,
  );

export const getCourseUnits = (subject: string, course: string) =>
  loadContent().units.filter((e) => e.subject.id === subject && e.course.id === course);

/** Lightweight summary for the home page — never includes card bodies. */
export function homeSummary() {
  const { units } = loadContent();
  const byCourse = new Map<string, UnitEntry[]>();
  for (const e of units) {
    const k = `${e.subject.id}/${e.course.id}`;
    byCourse.set(k, [...(byCourse.get(k) ?? []), e]);
  }
  const courses = [...byCourse.values()]
    .filter((list) => list.length > 0)
    .map((list) => ({
      subjectId: list[0].subject.id,
      courseId: list[0].course.id,
      title: list[0].course.title,
      titleDhivehi: list[0].course.titleDhivehi ?? "",
      grade: list[0].course.grade ?? 0,
      order: list[0].course.order,
      mixedHref: `/${list[0].subject.id}/${list[0].course.id}/mixed`,
      totals: {
        units: list.length,
        questions: list.reduce((n, e) => n + e.flashcards.cards.length, 0),
        lessons: list.reduce((n, e) => n + e.unit.lessons.length, 0),
      },
      units: list.map((e) => ({
        id: e.unit.id,
        key: e.key,
        href: e.href,
        number: e.unit.number,
        icon: e.unit.icon,
        title: e.unit.title,
        titleEnglish: e.unit.titleEnglish ?? "",
        lessonCount: e.unit.lessons.length,
        questionCount: e.flashcards.cards.length,
      })),
    }))
    .sort((a, b) => a.order - b.order);

  return {
    courses,
    grand: {
      questions: courses.reduce((n, c) => n + c.totals.questions, 0),
      units: courses.reduce((n, c) => n + c.totals.units, 0),
      lessons: courses.reduce((n, c) => n + c.totals.lessons, 0),
    },
  };
}
export type HomeSummary = ReturnType<typeof homeSummary>;

/** unit-id -> lesson-title -> lesson-id. Used by the client v2 migration. */
export function v2LessonMap(): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const e of loadContent().units) {
    out[e.unit.id] = Object.fromEntries(e.unit.lessons.map((l) => [l.title, l.id]));
  }
  return out;
}

/** A deterministic daily question, keyed to Maldives time (UTC+5). */
export function questionOfTheDay(now = new Date()) {
  const { units } = loadContent();
  const pool = units.flatMap((e) => {
    const lessonById = new Map(e.unit.lessons.map((l) => [l.id, l]));
    return e.flashcards.cards.map((card) => ({
      card,
      subjectId: e.subject.id,
      courseId: e.course.id,
      grade: e.course.grade ?? 0,
      unitNumber: e.unit.number,
      unitTitle: e.unit.title,
      unitTitleEnglish: e.unit.titleEnglish ?? e.unit.id,
      lesson: lessonById.get(card.lessonId),
      href: e.href,
    }));
  });

  if (pool.length === 0) return null;

  // Use the Maldives calendar date even when the server itself runs in UTC.
  const maldives = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const dateKey = maldives.toISOString().slice(0, 10);

  // Small stable FNV-1a-style hash: same date -> same question for everyone.
  let hash = 2166136261;
  for (const ch of `koveline:${dateKey}`) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const picked = pool[(hash >>> 0) % pool.length];
  return { ...picked, dateKey };
}
export type DailyQuestion = NonNullable<ReturnType<typeof questionOfTheDay>>;

/** Full card catalogue used only on the tucked-away custom-test page. */
export function customTestCatalog() {
  return loadContent().units.map((e) => {
    const lessonById = new Map(e.unit.lessons.map((l) => [l.id, l.title]));
    return {
      key: e.key,
      subjectId: e.subject.id,
      courseId: e.course.id,
      courseTitle: e.course.title,
      grade: e.course.grade ?? 0,
      unitId: e.unit.id,
      unitNumber: e.unit.number,
      title: e.unit.title,
      titleEnglish: e.unit.titleEnglish ?? e.unit.id,
      cards: e.flashcards.cards.map((card) => ({
        ...card,
        id: `${e.course.id}:${e.unit.id}:${card.id}`,
        unitBadge: {
          grade: e.course.grade ?? 0,
          number: e.unit.number,
          titleEnglish: e.unit.titleEnglish ?? e.unit.id,
          lessonTitle: lessonById.get(card.lessonId),
        },
      })),
    };
  });
}
export type CustomTestCatalog = ReturnType<typeof customTestCatalog>;

