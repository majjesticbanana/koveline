"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { syncAllProgress } from "@/lib/progress-sync";

/**
 * Client-side knowledge of who is signed in.
 *
 * The session lives in an httpOnly cookie, so only the server can read it —
 * but reading it in the root layout would make every page in this otherwise
 * fully static site dynamic. Instead the shell renders anonymously and this
 * provider asks `/api/auth/me` once on mount, which keeps prerendering and the
 * offline service worker intact. Accounts are optional; `student: null` is a
 * perfectly normal, fully working state.
 */

export interface SessionStudent {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "ADMIN";
}

interface SessionValue {
  student: SessionStudent | null;
  /**
   * Whose progress this browser should be reading and writing right now: the
   * student's id, or null while signed out. Pass it to every storage helper.
   */
  identity: string | null;
  /** True until `/api/auth/me` answers — render a placeholder, not "Sign in". */
  loading: boolean;
  /**
   * Bumped after saved progress has been pulled down for this student, so
   * anything already showing local progress can re-read it. 0 = not yet.
   */
  syncStamp: number;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  student: null,
  identity: null,
  loading: true,
  syncStamp: 0,
  refresh: async () => {},
  signOut: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [student, setStudent] = useState<SessionStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStamp, setSyncStamp] = useState(0);
  const syncedFor = useRef<string | null>(null);
  const checkedAt = useRef(0);

  const refresh = useCallback(async () => {
    checkedAt.current = Date.now();
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { student: SessionStudent | null };
      setStudent(res.ok ? data.student ?? null : null);
    } catch {
      setStudent(null); // offline: study anonymously, local progress is intact
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Nothing remounts this provider — not a client-side navigation, not a tab
   * sitting open for a day — so it re-checks when a tab comes back to the
   * front. That is what catches a sign-in or sign-out done in another tab, and
   * a session that expired while the tab was idle. Throttled, because a
   * student flicking between tabs should not mean a request each time.
   */
  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - checkedAt.current < 60_000) return;
      void refresh();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [refresh]);

  // Two-way sync, once per signed-in student per page load: push what this
  // browser has, adopt anything newer saved from another device.
  useEffect(() => {
    if (!student || syncedFor.current === student.id) return;
    syncedFor.current = student.id;
    void syncAllProgress(student.id)
      .then(() => setSyncStamp(Date.now()))
      .catch(() => {
        syncedFor.current = null; // let a later refresh try again
      });
  }, [student]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* fall through — clearing local session state is still the right move */
    }
    syncedFor.current = null;
    setStudent(null);
    // That student's progress stays under their own namespace in localStorage —
    // invisible to whoever uses the browser next, and there for them offline.
    if (pathname.startsWith("/account") || pathname.startsWith("/admin")) router.push("/");
    router.refresh();
  }, [pathname, router]);

  const value = useMemo(
    () => ({ student, identity: student?.id ?? null, loading, syncStamp, refresh, signOut }),
    [student, loading, syncStamp, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
