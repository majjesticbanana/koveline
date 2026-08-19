import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import siteCopy from "@/content/site-copy.json";
import { LogoutButton } from "./logout-button";
import { ClearProgress } from "./clear-progress";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const me = await getCurrentStudent();
  if (!me) redirect("/login?next=/account");

  const saved = await prisma.progress.aggregate({
    where: { studentId: me.id },
    _count: { _all: true },
    _max: { updatedAt: true },
  });
  const decks = saved._count._all;
  const lastSaved = saved._max.updatedAt;

  const copy = siteCopy.account;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-5 sm:py-16">
      <div className="animate-rise rounded-panel border border-line bg-surface p-6 shadow-glass sm:p-7">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-cocoa">
          {copy.signedIn}
        </p>
        <h1 className="mt-1 break-words font-display text-2xl font-bold text-ink sm:text-3xl">
          {me.name ?? me.email}
        </h1>

        <dl className="mt-5 space-y-2 text-sm sm:mt-6">
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            <dt className="w-14 shrink-0 text-cocoa">{copy.email}</dt>
            <dd className="min-w-0 break-all text-coffee">{me.email}</dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            <dt className="w-14 shrink-0 text-cocoa">{copy.role}</dt>
            <dd className="text-coffee">{me.role === "ADMIN" ? copy.roleAdmin : copy.roleStudent}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-card border border-line bg-raised/40 p-4">
          <p className="text-sm font-bold text-coffee">{copy.progressLabel}</p>
          <p className="mt-1 text-sm text-cocoa">
            {decks === 0 ? (
              copy.progressNone
            ) : (
              <>
                {decks} {decks === 1 ? copy.progressDeck : copy.progressDecks}
                {lastSaved && (
                  <>
                    {" · "}
                    {lastSaved.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </>
                )}
                <span className="mt-1 block">{copy.progressNote}</span>
              </>
            )}
          </p>
          <ClearProgress hasProgress={decks > 0} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {me.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-ctl bg-teal px-4 py-2.5 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
            >
              {copy.admin}
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
