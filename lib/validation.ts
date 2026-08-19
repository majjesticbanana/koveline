/** Shared request validation for the auth / admin API. */
import { z } from "zod";

export const emailField = z.string().trim().toLowerCase().email().max(200);
export const passwordField = z.string().min(8, "Password must be at least 8 characters").max(200);
const nameField = z.string().trim().min(1).max(120);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
});

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField.optional(),
});

export const createStudentSchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField.optional(),
  role: z.enum(["STUDENT", "ADMIN"]).default("STUDENT"),
});

export const updateStudentSchema = z
  .object({
    name: nameField.nullable().optional(),
    role: z.enum(["STUDENT", "ADMIN"]).optional(),
    disabled: z.boolean().optional(),
    password: passwordField.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

/* --- progress sync ---------------------------------------------------------- */

/** Cheap ceiling so one account can't push an unbounded blob into the DB. */
const MAX_CARDS = 4000;

const markMap = z
  .record(z.string().max(64), z.enum(["correct", "wrong"]))
  .refine((m) => Object.keys(m).length <= MAX_CARDS, { message: "Too many cards" });

/** The deck blob the browser keeps in localStorage, mirrored verbatim. */
export const progressDataSchema = z.object({
  status: markMap.optional(),
  mode: z.enum(["random", "sequential", "wrongOnly"]).optional(),
  idx: z.number().int().min(0).max(MAX_CARDS).optional(),
  lessonId: z.string().max(80).optional(),
  orderIds: z.array(z.string().max(64)).max(MAX_CARDS).optional(),
});

export const progressEntrySchema = z.object({
  // resource keys look like `islam/grade-9/unit-1/flashcards`
  key: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9/:_-]+$/, "Bad resource key"),
  data: progressDataSchema,
  /** Epoch ms from the client; decides the winner when two devices disagree. */
  updatedAt: z.number().int().min(0),
});

export const progressSyncSchema = z.object({
  entries: z.array(progressEntrySchema).max(200),
});
