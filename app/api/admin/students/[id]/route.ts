import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, hashPassword } from "@/lib/auth";
import { updateStudentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/students/:id — update name / role / disabled / password. */
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const parsed = updateStudentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 400 },
    );
  }

  // Guard against an admin locking themselves out.
  if (id === admin.id && (parsed.data.disabled === true || parsed.data.role === "STUDENT")) {
    return NextResponse.json({ error: "You can't disable or demote your own account." }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const data: Prisma.StudentUpdateInput = { ...rest };
  if (password) data.passwordHash = await hashPassword(password);
  // A password reset (or disabling) should invalidate existing sessions.
  const shouldRevoke = password !== undefined || parsed.data.disabled === true;

  try {
    const [student] = await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, disabled: true, createdAt: true },
      }),
      ...(shouldRevoke ? [prisma.session.deleteMany({ where: { studentId: id } })] : []),
    ]);
    return NextResponse.json({ student });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    throw e;
  }
}

/** DELETE /api/admin/students/:id — remove an account. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  try {
    await prisma.student.delete({ where: { id } }); // sessions cascade
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    throw e;
  }
}
