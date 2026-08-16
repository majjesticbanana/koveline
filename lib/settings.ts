"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Settings live on <html> as data-* attributes so CSS can react to
 * them with no re-render, and so the first paint is already correct
 * (see the inline boot script in app/layout.tsx).
 * ------------------------------------------------------------------ */

export const THEMES = [
  { id: "mahogany", name: "Mahogany", note: "The default — warm espresso and ember." },
  { id: "basalt", name: "Basalt", note: "Cooler charcoal with a brass accent." },
  { id: "lagoon", name: "Lagoon", note: "Deep teal, the colour of the shallows." },
  { id: "paper", name: "Paper", note: "Light cream, for bright rooms and daylight." },
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
  /** Reveal the answer with the spacebar without also advancing. */
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

export function applySettings(s: Settings) {
  const el = document.documentElement;
  el.dataset.theme = s.theme;
  el.dataset.motion = s.performance ? "off" : s.motion;
  el.dataset.perf = s.performance ? "on" : "off";
  el.style.setProperty("--thaana-scale", String(s.thaanaScale / 100));
}

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
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
      const next = { ...current, ...patch };
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
