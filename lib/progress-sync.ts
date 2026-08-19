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
 */
import { PROGRESS_PREFIX, progressKey, readJSON, writeJSON } from "./storage";

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

/** Every deck this browser has progress for, newest first. */
export function listLocalProgress(): ProgressEntry[] {
  if (typeof window === "undefined") return [];
  const out: ProgressEntry[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const raw = window.localStorage.key(i);
      if (!raw?.startsWith(PROGRESS_PREFIX)) continue;
      const key = raw.slice(PROGRESS_PREFIX.length);
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
export function applyServerProgress(server: ServerProgress): string[] {
  const changed: string[] = [];
  for (const [key, entry] of Object.entries(server ?? {})) {
    if (!entry || typeof entry.updatedAt !== "number" || !isSyncable(key)) continue;
    const local = readJSON<StoredProgress>(progressKey(key));
    if (entry.updatedAt <= stampOf(local)) continue;
    writeJSON(progressKey(key), { ...entry.data, updatedAt: entry.updatedAt });
    changed.push(key);
  }
  return changed;
}

/**
 * Push every local deck and adopt whatever comes back newer. Run once per page
 * load for a signed-in student; resolves to the keys that changed locally.
 */
export async function syncAllProgress(): Promise<string[]> {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entries: listLocalProgress() }),
  });
  if (!res.ok) throw new Error(`progress sync failed (${res.status})`);
  const { progress } = (await res.json()) as { progress: ServerProgress };
  return applyServerProgress(progress);
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
