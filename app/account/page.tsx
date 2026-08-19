import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const me = await getCurrentStudent();
  if (!me) redirect("/login?next=/account");

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-5 py-16">
      <div className="animate-rise rounded-panel border border-line bg-surface p-7 shadow-glass">
        <p className="text-sm font-semibold uppercase tracking-wide text-cocoa">Signed in</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">
          {me.name ?? me.email}
        </h1>
        <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-cocoa">Email</dt>
          <dd className="text-coffee">{me.email}</dd>
          <dt className="text-cocoa">Role</dt>
          <dd className="text-coffee">{me.role === "ADMIN" ? "Administrator" : "Student"}</dd>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {me.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-ctl bg-teal px-4 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
            >
              Open admin panel
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
