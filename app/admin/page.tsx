import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "../account/logout-button";
import { StudentsManager, type AdminStudent } from "./students-manager";

export const metadata = { title: "Admin — students" };

export default async function AdminPage() {
  const me = await getCurrentStudent();
  if (!me) redirect("/login?next=/admin");
  if (me.role !== "ADMIN") redirect("/account");

  const students = (await prisma.student.findMany({
    select: { id: true, email: true, name: true, role: true, disabled: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })) as AdminStudent[];

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-5 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Students</h1>
          <p className="mt-1 text-sm text-cocoa">
            Signed in as {me.email} · {students.length} account{students.length === 1 ? "" : "s"}
          </p>
        </div>
        <LogoutButton />
      </header>

      <StudentsManager initial={students} currentAdminId={me.id} />
    </main>
  );
}
