"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearLocalProgress } from "@/lib/progress-sync";
import { useSession } from "@/components/session-provider";

/**
 * Start this account's saved progress over — on the server and on this device.
 * Two clicks, because it cannot be undone. Other devices drop their copy the
 * next time they sync, since an empty account has nothing newer to send back.
 */
export function ClearProgress({ hasProgress }: { hasProgress: boolean }) {
  const router = useRouter();
  const { identity } = useSession();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasProgress) return null;

  async function clear() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/progress", { method: "DELETE" });
      if (!res.ok) throw new Error();
      clearLocalProgress(identity);
      setArmed(false);
      router.refresh();
    } catch {
      setError("Could not clear it. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {armed ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={clear}
            className="rounded-ctl border border-red-line bg-red-bg px-3 py-1.5 text-sm font-bold text-red transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Clearing…" : "Yes, clear it"}
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="rounded-ctl border border-line px-3 py-1.5 text-sm font-semibold text-cocoa transition hover:border-line-strong"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="text-sm font-semibold text-cocoa underline-offset-2 hover:text-red hover:underline"
        >
          Clear saved progress
        </button>
      )}
      {error && (
        <p className="mt-2 text-sm text-red" role="alert">{error}</p>
      )}
    </div>
  );
}
