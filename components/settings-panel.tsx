"use client";

import { useEffect, useRef, useState } from "react";
import { Settings2, X, Check } from "lucide-react";
import { THEMES, useSettings, type Settings } from "@/lib/settings";
import siteCopy from "@/content/site-copy.json";

const FOCUSABLE = 'button, [href], input, select, [tabindex]:not([tabindex="-1"])';

function Row({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <strong>{title}</strong>
        {note && <span>{note}</span>}
      </div>
      {children}
    </div>
  );
}

function Segment<T extends string | number | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="settings-segment" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={value === o.v ? "is-selected" : ""}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ThemePreview({ themeId }: { themeId: string }) {
  return (
    <span className="settings-theme-preview" data-preview-palette={themeId} aria-hidden>
      <span className="settings-preview-shell">
        <span className="settings-preview-topline" />
        <span className="settings-preview-copy">
          <i />
          <i />
          <i />
        </span>
        <span className="settings-preview-answer">
          <i />
          <i />
        </span>
        <span className="settings-preview-status">
          <i data-status="right" />
          <i data-status="wrong" />
        </span>
      </span>
    </span>
  );
}

export function SettingsPanel() {
  const { settings, update, reset } = useSettings();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !panelRef.current) return;
      const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      returnRef.current?.focus();
    };
  }, [open]);

  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => update({ [k]: v } as Partial<Settings>);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="settings-trigger glass-control"
        aria-label="Settings"
      >
        <Settings2 className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <>
          <div className="settings-scrim" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="settings-panel glass-panel"
          >
            <div className="settings-head">
              <div>
                <h2>Settings</h2>
                <p>Make Koveline comfortable to read and study in.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close settings"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="settings-body">
              <section className="settings-theme-section" aria-labelledby="theme-heading">
                <div className="settings-section-heading">
                  <div>
                    <div id="theme-heading" className="settings-group-label">Theme</div>
                    <h3>Reading palette</h3>
                  </div>
                  <p>Five restrained palettes. Correct, wrong and muted text stay semantic in every one.</p>
                </div>

                <div className="settings-themes">
                  {THEMES.map((t) => {
                    const selected = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => update({ theme: t.id })}
                        aria-pressed={selected}
                        aria-label={`${t.name} theme — ${t.note}`}
                        className={`settings-theme ${selected ? "is-selected" : ""}`}
                        data-theme-preview={t.id}
                      >
                        <ThemePreview themeId={t.id} />
                        <span className="settings-theme-copy">
                          <span className="settings-theme-titleline">
                            <strong>{t.name}</strong>
                            <small>{t.mode}</small>
                          </span>
                          <span>{t.note}</span>
                        </span>
                        <span className="settings-theme-check" aria-hidden>
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="settings-group-label">Display</div>

              <Row
                title="Performance mode"
                note="Cuts decorative effects and shadows. Best on older PCs and phones."
              >
                <Segment
                  label="Performance mode"
                  value={settings.performance}
                  onChange={set("performance")}
                  options={[
                    { v: false, label: "Off" },
                    { v: true, label: "On" },
                  ]}
                />
              </Row>

              <Row
                title="Motion"
                note={
                  settings.performance
                    ? "Controlled by performance mode."
                    : "Reduced keeps transitions but drops the ambient layer."
                }
              >
                <Segment
                  label="Motion"
                  value={settings.motion}
                  onChange={set("motion")}
                  options={[
                    { v: "full", label: "Full" },
                    { v: "reduced", label: "Reduced" },
                    { v: "off", label: "Off" },
                  ]}
                />
              </Row>

              <Row title="Dhivehi size" note="Scales Thaana only. English stays as it is.">
                <Segment
                  label="Dhivehi size"
                  value={settings.thaanaScale}
                  onChange={set("thaanaScale")}
                  options={[
                    { v: 100, label: "Normal" },
                    { v: 110, label: "Large" },
                    { v: 125, label: "Largest" },
                  ]}
                />
              </Row>

              <div className="settings-group-label">Studying</div>

              <Row title="Confirm before reset" note="Ask before clearing a deck's progress.">
                <Segment
                  label="Confirm before reset"
                  value={settings.confirmReset}
                  onChange={set("confirmReset")}
                  options={[
                    { v: true, label: "Ask" },
                    { v: false, label: "Don't ask" },
                  ]}
                />
              </Row>

              <button type="button" className="settings-reset" onClick={reset}>
                Reset settings to default
              </button>
              <p className="settings-note">
                Settings and study progress are saved on this device only.
              </p>

              <div className="settings-contact">
                <strong>Spotted a mistake, or want something added?</strong>
                <a href={`mailto:${siteCopy.brand.contactEmail}`}>{siteCopy.brand.contactEmail}</a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
