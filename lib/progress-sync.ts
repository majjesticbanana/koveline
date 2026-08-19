/**
 * Deck progress ↔ account sync (browser side).
 *
 * Accounts are optional. Signed-out visitors never call anything here: the
 * deck keeps writing localStorage exactly as it always did. Once a student is
 * signed in, the same blobs are mirrored to `/api/progress`, so a deck started
 * on a phone can be finished on a laptop.
 *
 * Every stored blob carries an `updatedAt` epoch stamp; whichever side has the
 * newer stamp for a deck wins. See app/api/progress/route.ts for the server
 * half of that rule.
 *
 * All of it is namespaced by identity, because a browser is a device and not a
 * person: two students sharing a laptop must never see, or upload, each
 * other's marks.
 */
import {
  type Identity, type LastStudied,
  lastStudiedKey, progressKey, progressPrefix, readJSON, removeKey, writeJSON,
} from "./storage";

export interface StoredProgress {
  status?: Record<string, "correct" | "wrong">;
  mode?: string;
  idx?: number;
  lessonId?: string;
  orderIds?: string[];
  updatedAt?: number;
}

export interface ProgressEntry {
  key: string;
  data: StoredProgress;
  updatedAt: number;
}

export type ServerProgress = Record<string, { data: StoredProgress; updatedAt: number }>;

/** Mirrors `progressEntrySchema` on the server, so nothing we send is rejected. */
const MAX_ENTRIES = 200;

/**
 * A custom test is built fresh every time and never restored, so its blob is
 * scratch space for this device — syncing it would just cost a row and a
 * round-trip.
 */
const DEVICE_LOCAL = ["custom-test/"];
const isSyncable = (key: string) => !DEVICE_LOCAL.some((p) => key.startsWith(p));

const stampOf = (v: StoredProgress | null) =>
  typeof v?.updatedAt === "number" && v.updatedAt >= 0 ? v.updatedAt : 0;

/** Strip our own bookkeeping field before it goes over the wire. */
function payload({ updatedAt: _stamp, ...rest }: StoredProgress): StoredProgress {
  return rest;
}

/** Every deck stored for one identity on this browser, newest first. */
export function listLocalProgress(who: Identity): ProgressEntry[] {
  if (typeof window === "undefined") return [];
  const prefix = progressPrefix(who);
  const out: ProgressEntry[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const raw = window.localStorage.key(i);
      if (!raw?.startsWith(prefix)) continue;
      const key = raw.slice(prefix.length);
      if (!isSyncable(key)) continue;
      const data = readJSON<StoredProgress>(raw);
      if (!data || typeof data !== "object") continue;
      out.push({ key, data: payload(data), updatedAt: stampOf(data) });
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_ENTRIES);
}

/** Write down anything the server holds a newer copy of. Returns those keys. */
export function applyServerProgress(server: ServerProgress, who: Identity): string[] {
  const changed: string[] = [];
  for (const [key, entry] of Object.entries(server ?? {})) {
    if (!entry || typeof entry.updatedAt !== "number" || !isSyncable(key)) continue;
    const local = readJSON<StoredProgress>(progressKey(key, who));
    if (entry.updatedAt <= stampOf(local)) continue;
    writeJSON(progressKey(key, who), { ...entry.data, updatedAt: entry.updatedAt });
    changed.push(key);
  }
  return changed;
}

async function push(entries: ProgressEntry[]): Promise<ServerProgress> {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error(`progress sync failed (${res.status})`);
  const { progress } = (await res.json()) as { progress: ServerProgress };
  return progress;
}

/**
 * Hand work done before signing up over to the account that just claimed it —
 * moved, not copied, so a second account on the same browser can never claim
 * it as well. Only ever called for an account with nothing saved anywhere.
 */
function adoptAnonymousProgress(studentId: string): string[] {
  const moved: string[] = [];
  for (const entry of listLocalProgress(null)) {
    writeJSON(progressKey(entry.key, studentId), { ...entry.data, updatedAt: entry.updatedAt });
    removeKey(progressKey(entry.key, null));
    moved.push(entry.key);
  }
  const last = readJSON<LastStudied>(lastStudiedKey(null));
  if (last) {
    writeJSON(lastStudiedKey(studentId), last);
    removeKey(lastStudiedKey(null));
  }
  return moved;
}

/**
 * Push this student's local decks and adopt whatever comes back newer. Run
 * once per page load for a signed-in student; resolves to the keys that
 * changed locally.
 */
export async function syncAllProgress(studentId: string): Promise<string[]> {
  let merged = await push(listLocalProgress(studentId));

  // A brand-new account on a browser that has been studying anonymously: this
  // is the "I studied for a week, then signed up" case, and the only time
  // anonymous work is allowed to enter an account.
  const accountIsEmpty =
    Object.keys(merged).length === 0 && listLocalProgress(studentId).length === 0;
  if (accountIsEmpty && adoptAnonymousProgress(studentId).length > 0) {
    merged = await push(listLocalProgress(studentId));
  }

  return applyServerProgress(merged, studentId);
}

/** Forget one identity's decks on this browser (the server half is a DELETE). */
export function clearLocalProgress(who: Identity): number {
  if (typeof window === "undefined") return 0;
  const prefix = progressPrefix(who);
  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const raw = window.localStorage.key(i);
      if (raw?.startsWith(prefix)) keys.push(raw);
    }
  } catch {
    return 0;
  }
  keys.forEach(removeKey);
  removeKey(lastStudiedKey(who));
  return keys.length;
}

/* --- live pushes while studying --------------------------------------------- */

const PUSH_DELAY = 1500;
const pending = new Map<string, ProgressEntry>();
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (pending.size === 0) return;
  const entries = [...pending.values()];
  pending.clear();
  // keepalive so a push started as the tab closes still gets out.
  void fetch("/api/progress", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entries }),
    keepalive: true,
  }).catch(() => {
    /* offline or signed out — localStorage still has it, next load re-syncs */
  });
}

/**
 * Queue one deck for saving. Marking cards fires on every keystroke-ish
 * interaction, so pushes are coalesced per deck and debounced; a tab going
 * away flushes immediately.
 */
export function queueProgressPush(key: string, data: StoredProgress, updatedAt: number) {
  if (typeof window === "undefined" || !isSyncable(key)) return;
  pending.set(key, { key, data: payload(data), updatedAt });

  if (!listening) {
    listening = true;
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, PUSH_DELAY);
}
