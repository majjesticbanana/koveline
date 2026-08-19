/** Safe localStorage JSON helpers + the one-time v2 -> v3 migration. */

export function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore: private mode / quota */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* ---------------- v3 keys ---------------- */

export const PROGRESS_PREFIX = "koveline:v3:progress:";
export const progressKey = (resourceKey: string) => `${PROGRESS_PREFIX}${resourceKey}`;
export const LAST_STUDIED_KEY = "koveline:v3:last-studied";

export interface LastStudied {
  href: string;
  label: string;
  ts: number;
}

export function rememberLastStudied(entry: Omit<LastStudied, "ts">) {
  writeJSON(LAST_STUDIED_KEY, { ...entry, ts: Date.now() });
}

/* ---------------- v2 -> v3 migration ---------------- */

interface V2Saved {
  status?: Record<string, "correct" | "wrong">;
  mode?: string;
  idx?: number;
  lesson?: string;
  orderIds?: number[];
}

const V2_UNIT_KEYS: Record<string, string> = {
  unit1: "unit-1",
  unit2: "unit-2",
  unit3: "unit-3",
  "grade9-islam-unit4": "unit-4",
  "grade9-islam-unit5": "unit-5",
  "grade9-islam-unit6": "unit-6",
};

const V2_LESSON_NUM = /^\s*ފިލާވަޅު\s*(\d+)\s*$/;

/**
 * Runs once per browser (guarded by a flag key). Maps every v2 progress
 * blob onto its v3 resource, converts numeric card ids to `q{n}`, converts
 * the lesson string to a lesson id where possible, and deletes v2 keys —
 * including the removed definitions deck.
 */
export function migrateV2Storage(lessonTitleToId: Record<string, Record<string, string>>) {
  if (typeof window === "undefined") return;
  const FLAG = "koveline:v3:migrated";
  try {
    if (window.localStorage.getItem(FLAG)) return;
  } catch {
    return;
  }

  for (const [oldUnit, newUnit] of Object.entries(V2_UNIT_KEYS)) {
    const old = readJSON<V2Saved>(`koveline-progress-${oldUnit}`);
    if (old && old.status && Object.keys(old.status).length > 0) {
      const status: Record<string, "correct" | "wrong"> = {};
      for (const [id, v] of Object.entries(old.status)) {
        if (v === "correct" || v === "wrong") status[`q${id}`] = v;
      }
      let lessonId: string | undefined;
      if (old.lesson && old.lesson !== "__all__") {
        const m = V2_LESSON_NUM.exec(old.lesson);
        if (m) lessonId = `l${m[1]}`;
        else lessonId = lessonTitleToId[newUnit]?.[old.lesson.trim()];
      }
      writeJSON(progressKey(`islam/grade-9/${newUnit}/flashcards`), {
        status,
        mode: old.mode === "random" || old.mode === "wrongOnly" ? old.mode : "sequential",
        idx: typeof old.idx === "number" ? old.idx : 0,
        lessonId: lessonId ?? "__all__",
        orderIds: Array.isArray(old.orderIds) ? old.orderIds.map((n) => `q${n}`) : undefined,
      });
    }
    remove(`koveline-progress-${oldUnit}`);
  }

  // last-studied: rewrite the href onto the new route
  const last = readJSON<LastStudied>("koveline-last-studied");
  if (last?.href) {
    const m = /\/quizzes\/grade9-islam\/([a-z0-9-]+)/.exec(last.href);
    const newUnit = m ? V2_UNIT_KEYS[m[1]] : undefined;
    if (newUnit) {
      writeJSON(LAST_STUDIED_KEY, {
        ...last,
        href: `/islam/grade-9/${newUnit}/flashcards`,
      });
    }
  }
  remove("koveline-last-studied");

  // the removed definitions deck
  remove("koveline-defs-progress");

  writeJSON(FLAG, 1);
}
