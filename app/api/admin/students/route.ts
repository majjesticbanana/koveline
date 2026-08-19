import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, hashPassword } from "@/lib/auth";
import { createStudentSchema } from "@/lib/validation";

const studentSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabled: true,
  createdAt: true,
} as const;

/** GET /api/admin/students — list all accounts (admin only). */
export async function GET() {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const students = await prisma.student.findMany({
    select: studentSelect,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ students });
}

/** POST /api/admin/students — create an account (admin only). */
export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const parsed = createStudentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details." },
      { status: 400 },
    );
  }
  const { email, password, name, role } = parsed.data;

  try {
    const student = await prisma.student.create({
      data: { email, name: name ?? null, role, passwordHash: await hashPassword(password) },
      select: studentSelect,
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    throw e;
  }
}
