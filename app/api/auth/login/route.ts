import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const student = await prisma.student.findUnique({ where: { email } });
  // Same response whether the email is unknown or the password is wrong, so the
  // endpoint can't be used to enumerate accounts.
  const ok = student && !student.disabled && (await verifyPassword(password, student.passwordHash));
  if (!ok || !student) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(student.id);
  return NextResponse.json({
    student: { id: student.id, email: student.email, name: student.name, role: student.role },
  });
}
