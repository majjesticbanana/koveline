import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

/** Slug: lowercase, digits, hyphens. Used for every id that appears in a URL. */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase hyphenated slug");

/** Local id, unique only within its parent resource (e.g. "l3", "q17"). */
export const LocalId = z.string().regex(/^[a-z][a-z0-9-]*$/, "must start with a letter");

export const Lang = z.enum(["dv", "en", "ar"]);

/**
 * A rendered answer body. v1 stored `string | string[] | object`, which the
 * TypeScript types claimed was `string | string[]` — a lie that only worked
 * because AnswerView guessed at runtime. Making the shape explicit means the
 * renderer can be total, with no `JSON.stringify` fallback.
 */
export const RichBody: z.ZodType<RichBodyT> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("text"),
      value: z.string().min(1),
      lang: Lang.optional(),
    }),
    z.object({
      kind: z.literal("list"),
      items: z.array(z.string().min(1)).min(1),
      ordered: z.boolean().default(false),
      lang: Lang.optional(),
    }),
    z.object({
      kind: z.literal("image"),
      src: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      alt: z.string().min(1),
    }),
    z.object({
      kind: z.literal("sections"),
      sections: z
        .array(
          z.object({
            heading: z.string().min(1),
            body: RichBody,
          }),
        )
        .min(1),
    }),
  ]),
);

export type RichBodyT =
  | { kind: "text"; value: string; lang?: "dv" | "en" | "ar" }
  | { kind: "image"; src: string; width: number; height: number; alt: string }
  | { kind: "list"; items: string[]; ordered: boolean; lang?: "dv" | "en" | "ar" }
  | { kind: "sections"; sections: { heading: string; body: RichBodyT }[] };

/* ------------------------------------------------------------------ *
 * Taxonomy: Subject -> Course -> Unit -> Resource
 * ------------------------------------------------------------------ */

export const Subject = z.object({
  id: Slug,
  name: z.string().min(1),
  nameDhivehi: z.string().optional(),
  /** Emoji or short glyph shown on cards. */
  icon: z.string().min(1),
  /** Tailwind colour token from tailwind.config.ts. */
  accent: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const Credit = z.object({
  english: z.string().min(1),
  dhivehi: z.string().optional(),
  note: z.string().optional(),
  url: z.string().url().optional(),
});

export const Course = z.object({
  id: Slug,
  subjectId: Slug,
  title: z.string().min(1),
  titleDhivehi: z.string().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  /**
   * Optional grouping for courses that are not a single school grade —
   * e.g. the Deyha & Daleels collection, which spans Grade 9 and 10.
   * Courses sharing a collection render as one section on the home page,
   * below the grade chapters.
   */
  collection: Slug.optional(),
  collectionTitle: z.string().optional(),
  collectionTitleDhivehi: z.string().optional(),
  /** Short label shown on the card inside a collection ("Grade 9", "Both grades"). */
  scopeLabel: z.string().optional(),
  /**
   * Topic tags this course can contribute to a Target Test — a future mode
   * that assembles a deck from weak areas rather than whole units. Declared
   * now so content can be tagged as it is added; nothing consumes it yet.
   */
  targets: z.array(Slug).optional(),
  /** Default language of this course's content; drives lang/dir on render. */
  contentLang: Lang.default("dv"),
  credit: Credit.optional(),
  order: z.number().int().nonnegative(),
  /** Hide from indexes without deleting the files. */
  draft: z.boolean().default(false),
});

export const Lesson = z.object({
  id: LocalId,
  number: z.number().int().positive(),
  title: z.string().min(1),
  titleEnglish: z.string().optional(),
});

export const Unit = z.object({
  id: Slug,
  number: z.number().int().positive(),
  icon: z.string().min(1),
  title: z.string().min(1),
  titleEnglish: z.string().optional(),
  description: z.string().optional(),
  /** Target-Test topic tags. Declared now, consumed later. */
  targets: z.array(Slug).optional(),
  lessons: z.array(Lesson).min(1),
  draft: z.boolean().default(false),
});

/* ------------------------------------------------------------------ *
 * Resources
 *
 * Every resource carries `type`, so one route and one engine can serve all
 * of them. `lessonId` is a reference into its unit's `lessons[]`, checked by
 * the validator — this is what makes the v1 lesson-filter bug impossible.
 * ------------------------------------------------------------------ */

const ResourceBase = {
  id: Slug,
  title: z.string().min(1),
  titleDhivehi: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  draft: z.boolean().default(false),
};

export const Flashcard = z.object({
  id: LocalId,
  lessonId: LocalId,
  /**
   * Stimulus material the paper places before the question — a quoted verse,
   * a hadith, or a scene-setting sentence. Kept separate so the question
   * itself reads cleanly, and rendered smaller above it.
   */
  context: z.string().optional(),
  front: z.string().min(1),
  /**
   * When the question is a scan of the real paper rather than typed text,
   * `front` stays as the accessible label and this carries the image.
   */
  frontImage: z
    .object({
      src: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  back: RichBody,
  /** Optional per-card language override. */
  lang: Lang.optional(),
});

export const FlashcardsResource = z.object({
  ...ResourceBase,
  type: z.literal("flashcards"),
  cards: z.array(Flashcard).min(1),
});

export const McqChoice = z.object({
  id: LocalId,
  text: z.string().min(1),
});

export const McqQuestion = z.object({
  id: LocalId,
  lessonId: LocalId,
  stem: z.string().min(1),
  choices: z.array(McqChoice).min(2).max(6),
  /** Must be one of `choices[].id`; cross-checked by the validator. */
  correct: LocalId,
  explanation: RichBody.optional(),
});

export const McqResource = z.object({
  ...ResourceBase,
  type: z.literal("mcq"),
  questions: z.array(McqQuestion).min(1),
});

export const PaperQuestion = z.object({
  id: LocalId,
  lessonId: LocalId.optional(),
  number: z.string().min(1),
  marks: z.number().int().positive().optional(),
  prompt: z.string().min(1),
  modelAnswer: RichBody.optional(),
});

export const PaperResource = z.object({
  ...ResourceBase,
  type: z.literal("paper"),
  year: z.number().int().min(2000).max(2100).optional(),
  session: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive().optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        instructions: z.string().optional(),
        questions: z.array(PaperQuestion).min(1),
      }),
    )
    .min(1),
});

/**
 * Notes live as markdown with YAML frontmatter (`notes.md` beside the unit),
 * so long Thaana prose stays readable in a diff. This schema validates the
 * frontmatter only; the body is markdown.
 */
export const NotesFrontmatter = z.object({
  ...ResourceBase,
  type: z.literal("notes"),
  lessonIds: z.array(LocalId).default([]),
  readingMinutes: z.number().int().positive().optional(),
});

export const Resource = z.discriminatedUnion("type", [
  FlashcardsResource,
  McqResource,
  PaperResource,
  NotesFrontmatter,
]);

export const RESOURCE_TYPES = ["flashcards", "mcq", "paper", "notes"] as const;

/* ------------------------------------------------------------------ *
 * Inferred types
 * ------------------------------------------------------------------ */

export type Subject = z.infer<typeof Subject>;
export type Course = z.infer<typeof Course>;
export type Lesson = z.infer<typeof Lesson>;
export type Unit = z.infer<typeof Unit>;
export type Flashcard = z.infer<typeof Flashcard>;
export type FlashcardsResource = z.infer<typeof FlashcardsResource>;
export type McqResource = z.infer<typeof McqResource>;
export type PaperResource = z.infer<typeof PaperResource>;
export type NotesFrontmatter = z.infer<typeof NotesFrontmatter>;
export type Resource = z.infer<typeof Resource>;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Stable, globally-unique key for progress storage and manifest lookup. */
export function resourceKey(
  subjectId: string,
  courseId: string,
  unitId: string,
  resourceId: string,
): string {
  return `${subjectId}/${courseId}/${unitId}/${resourceId}`;
}
