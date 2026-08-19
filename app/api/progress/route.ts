import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth";
import { progressSyncSchema } from "@/lib/validation";

/**
 * Saved deck progress for the signed-in student.
 *
 * Accounts are optional: signed-out visitors keep everything in localStorage
 * and never touch this route. Once signed in, the browser pushes the same
 * blobs here and pulls back anything newer from another device.
 *
 * Conflicts are resolved per deck by the client's `updatedAt` stamp —
 * last write wins. Merging mark-by-mark would be more forgiving, but it can
 * resurrect cards a student deliberately reset, which is worse.
 */

const noStore = { "cache-control": "no-store, private" } as const;

type Stored = { data: unknown; updatedAt: number };

const toMap = (rows: { resourceKey: string; data: unknown; updatedAt: Date }[]) =>
  Object.fromEntries(
    rows.map((r): [string, Stored] => [r.resourceKey, { data: r.data, updatedAt: r.updatedAt.getTime() }]),
  );

export async function GET() {
  const me = await getCurrentStudent();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  const rows = await prisma.progress.findMany({
    where: { studentId: me.id },
    select: { resourceKey: true, data: true, updatedAt: true },
  });
  return NextResponse.json({ progress: toMap(rows) }, { headers: noStore });
}

export async function PUT(req: Request) {
  const me = await getCurrentStudent();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  const parsed = progressSyncSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid progress." },
      { status: 400, headers: noStore },
    );
  }
  const { entries } = parsed.data;

  // A clock running fast would otherwise let one device win every future
  // conflict, so a stamp is never allowed to be later than the server's now.
  const now = Date.now();
  const incoming = new Map(
    entries.map((e) => [e.key, { data: e.data, stamp: Math.min(e.updatedAt, now) }]),
  );

  if (incoming.size > 0) {
    const existing = await prisma.progress.findMany({
      where: { studentId: me.id, resourceKey: { in: [...incoming.keys()] } },
      select: { resourceKey: true, updatedAt: true },
    });
    const stale = new Map(existing.map((r) => [r.resourceKey, r.updatedAt.getTime()]));

    const writes = [...incoming]
      .filter(([key, { stamp }]) => stamp > (stale.get(key) ?? -1))
      .map(([key, { data, stamp }]) =>
        prisma.progress.upsert({
          where: { studentId_resourceKey: { studentId: me.id, resourceKey: key } },
          create: {
            studentId: me.id,
            resourceKey: key,
            data: data as Prisma.InputJsonValue,
            updatedAt: new Date(stamp),
          },
          update: { data: data as Prisma.InputJsonValue, updatedAt: new Date(stamp) },
        }),
      );
    if (writes.length > 0) await prisma.$transaction(writes);
  }

  // Always answer with the full merged state: the browser uses it to pull down
  // decks studied elsewhere in the same round-trip it used to push.
  const rows = await prisma.progress.findMany({
    where: { studentId: me.id },
    select: { resourceKey: true, data: true, updatedAt: true },
  });
  return NextResponse.json({ progress: toMap(rows) }, { headers: noStore });
}

/** Forget everything this student has saved. Used by "clear saved progress". */
export async function DELETE() {
  const me = await getCurrentStudent();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: noStore });

  const { count } = await prisma.progress.deleteMany({ where: { studentId: me.id } });
  return NextResponse.json({ cleared: count }, { headers: noStore });
}
