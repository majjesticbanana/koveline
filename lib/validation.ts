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
