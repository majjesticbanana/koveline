import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details." },
      { status: 400 },
    );
  }
  const { email, password, name } = parsed.data;

  try {
    const student = await prisma.student.create({
      data: { email, name: name ?? null, passwordHash: await hashPassword(password) },
    });
    await createSession(student.id);
    return NextResponse.json(
      { student: { id: student.id, email: student.email, name: student.name, role: student.role } },
      { status: 201 },
    );
  } catch (e) {
    // Unique-constraint violation on email.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    throw e;
  }
}
