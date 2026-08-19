/**
 * Authentication core: password hashing and server-side sessions.
 *
 * Sessions are opaque random tokens stored in the `Session` table; the browser
 * only ever holds the token in an httpOnly cookie. Validation joins back to the
 * student, so disabling an account or deleting the row immediately logs them
 * out. There is no JWT — revocation is a single row delete.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE } from "./auth-cookie";

export { SESSION_COOKIE };
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export type SessionStudent = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

// --- passwords ---------------------------------------------------------------

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// --- sessions ----------------------------------------------------------------

const newToken = () => randomBytes(32).toString("hex");

/**
 * Create a session for a student and write the cookie. Call only from a Route
 * Handler or Server Action (where the cookie store is writable).
 */
export async function createSession(studentId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await prisma.session.create({ data: { token, studentId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { token, expiresAt };
}

/** Delete the current session (DB row + cookie). Safe to call when logged out. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    store.delete(SESSION_COOKIE);
  }
}

/**
 * The signed-in student, or null. Reads the session cookie, validates the row
 * is unexpired and the account is enabled. Memoised for the request via React
 * `cache`, so calling it in several server components hits the DB once.
 */
export const getCurrentStudent = cache(async (): Promise<SessionStudent | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { student: true },
  });

  if (!session || session.expiresAt < new Date() || session.student.disabled) {
    return null;
  }

  const { id, email, name, role } = session.student;
  return { id, email, name, role };
});

/** Convenience guard for admin-only server code. Throws-free: returns null. */
export async function getCurrentAdmin(): Promise<SessionStudent | null> {
  const me = await getCurrentStudent();
  return me?.role === "ADMIN" ? me : null;
}
