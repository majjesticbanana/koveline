"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Settings live on <html> as data-* attributes so CSS can react to
 * them with no re-render, and so the first paint is already correct
 * (see the inline boot script in app/layout.tsx).
 * ------------------------------------------------------------------ */

export const THEMES = [
  {
    id: "mahogany",
    name: "Mahogany",
    note: "Warm espresso, ivory and restrained rust.",
    mode: "Dark",
    browserColor: "#190c09",
  },
  {
    id: "graphite",
    name: "Graphite",
    note: "Cool charcoal with a soft steel-blue accent.",
    mode: "Dark",
    browserColor: "#11161c",
  },
  {
    id: "moss",
    name: "Moss",
    note: "Deep olive-green with a muted bronze accent.",
    mode: "Dark",
    browserColor: "#0f1712",
  },
  {
    id: "mulberry",
    name: "Mulberry",
    note: "Quiet plum with dusty rose, never neon purple.",
    mode: "Dark",
    browserColor: "#171116",
  },
  {
    id: "ivory",
    name: "Ivory",
    note: "Warm off-white with walnut for daylight studying.",
    mode: "Light",
    browserColor: "#f3efe7",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export type Settings = {
  theme: ThemeId;
  /** "full" | "reduced" | "off" — off also disables the ambient layer. */
  motion: "full" | "reduced" | "off";
  /** Drops ambient motion, glass blur and shadows in one switch. */
  performance: boolean;
  /** Thaana can run small on dense answers; this scales only Dhivehi. */
  thaanaScale: 100 | 110 | 125;
  /** Ask before clearing a deck's saved progress. */
  confirmReset: boolean;
};

export const DEFAULTS: Settings = {
  theme: "mahogany",
  motion: "full",
  performance: false,
  thaanaScale: 100,
  confirmReset: true,
};

export const SETTINGS_KEY = "koveline:v3:settings";

const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));
const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  basalt: "graphite",
  lagoon: "moss",
  paper: "ivory",
};

function normaliseTheme(value: unknown): ThemeId {
  if (typeof value !== "string") return DEFAULTS.theme;
  if (THEME_IDS.has(value)) return value as ThemeId;
  return LEGACY_THEME_MAP[value] ?? DEFAULTS.theme;
}

export function applySettings(s: Settings) {
  const el = document.documentElement;
  const theme = normaliseTheme(s.theme);
  el.dataset.theme = theme;
  el.dataset.motion = s.performance ? "off" : s.motion;
  el.dataset.perf = s.performance ? "on" : "off";
  el.style.setProperty("--thaana-scale", String(s.thaanaScale / 100));

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const themeMeta = THEMES.find((item) => item.id === theme);
  if (meta && themeMeta) meta.content = themeMeta.browserColor;
}

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings> & { theme?: string };
    return { ...DEFAULTS, ...parsed, theme: normaliseTheme(parsed.theme) } as Settings;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const s = readSettings();
    setSettings(s);
    applySettings(s);
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = {
        ...current,
        ...patch,
        theme: patch.theme ? normaliseTheme(patch.theme) : current.theme,
      } as Settings;
      applySettings(next);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* storage can be full or blocked; the setting still applies this session */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    applySettings(DEFAULTS);
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, reset, loaded };
}
