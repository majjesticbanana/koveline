"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={
        className ??
        "rounded-ctl border border-line px-4 py-2 text-sm font-semibold text-coffee transition-colors hover:bg-hover disabled:opacity-60"
      }
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
