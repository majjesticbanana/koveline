"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Save } from "lucide-react";
import { KoelMark } from "@/components/koel";

export type Mode = "random" | "sequential" | "wrongOnly";
export type Mark = "correct" | "wrong";
export type Tone = "" | "correct" | "wrong";

/* ---------- small bits ---------- */

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line bg-raised px-1.5 py-0.5 font-display text-[0.74rem] font-bold text-coffee">
      {children}
    </kbd>
  );
}

export function KbdHints() {
  return (
    <p className="mt-4 hidden text-center text-[0.76rem] text-cocoa sm:block">
      <Kbd>Space</Kbd> reveal / next · <Kbd>←</Kbd> <Kbd>→</Kbd> move · <Kbd>1</Kbd> right ·{" "}
      <Kbd>2</Kbd> wrong · <Kbd>Esc</Kbd> close
      <span className="mx-2 opacity-50">·</span>
      <Save className="mb-0.5 inline h-3 w-3 opacity-70" aria-hidden /> saves on this device
    </p>
  );
}

/* ---------- utility row: quiet, recedes (Sol #20) ---------- */

export function StatBar({
  index, total, correct, wrong, onOpenNav,
}: {
  index: number;
  total: number;
  correct: number;
  wrong: number;
  onOpenNav: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[0.85rem]">
      <button
        onClick={onOpenNav}
        className="glass-control inline-flex items-center gap-1.5 rounded-ctl border px-3 py-1.5 font-semibold text-coffee-deep transition hover:border-teal/60"
        aria-label={`Open the question navigator — question ${index} of ${total}`}
      >
        Question <b className="font-display">{index}</b>
        <span className="text-cocoa">/ {total}</span>
      </button>
      <span
        className="inline-flex items-center gap-1 rounded-ctl border border-green-line bg-green-bg px-3 py-1.5 font-semibold text-green"
        aria-label={`${correct} marked right`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden /> {correct}
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-ctl border border-red-line bg-red-bg px-3 py-1.5 font-semibold text-red"
        aria-label={`${wrong} marked wrong`}
      >
        <X className="h-3.5 w-3.5" aria-hidden /> {wrong}
      </span>
    </div>
  );
}

export function ProgressBar({ correct, wrong, total }: { correct: number; wrong: number; total: number }) {
  const cPct = total ? (correct / total) * 100 : 0;
  const wPct = total ? (wrong / total) * 100 : 0;
  return (
    <div
      className="mb-4 flex h-[6px] overflow-hidden rounded-full bg-latte"
      role="progressbar"
      aria-valuenow={Math.round(cPct + wPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress through this deck"
    >
      <i className="block h-full bg-green transition-[width] duration-500" style={{ width: `${cPct}%` }} />
      <i className="block h-full bg-red transition-[width] duration-500" style={{ width: `${wPct}%` }} />
    </div>
  );
}

/* ---------- mode controls: segmented order + review + demoted reset ---------- */

export function ModeBar({
  mode, wrongTotal, onMode, onReset,
}: {
  mode: Mode;
  wrongTotal: number;
  onMode: (m: Mode) => void;
  onReset: () => void;
}) {
  const seg = mode === "wrongOnly" ? null : mode; // segmented shows order only
  const segBtn = (m: "random" | "sequential", label: string) => (
    <button
      onClick={() => onMode(m)}
      aria-pressed={seg === m}
      className={`px-3.5 py-1.5 text-[0.84rem] font-bold transition ${
        seg === m ? "bg-teal text-accent-ink" : "text-coffee-deep hover:bg-raised"
      }`}
    >
      {label}
    </button>
  );
  const hasWrong = wrongTotal > 0;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
      <div
        role="group"
        aria-label="Question order"
        className="glass-control flex overflow-hidden rounded-ctl border"
      >
        {segBtn("sequential", "In order")}
        <span className="w-px bg-line" aria-hidden />
        {segBtn("random", "Random")}
      </div>
      <button
        onClick={() => hasWrong && onMode("wrongOnly")}
        disabled={!hasWrong}
        aria-pressed={mode === "wrongOnly"}
        className={`rounded-ctl border px-3.5 py-1.5 text-[0.84rem] font-bold transition ${
          mode === "wrongOnly"
            ? "border-red bg-red text-cream"
            : hasWrong
            ? "border-red-line bg-red-bg text-red hover:border-red"
            : "cursor-not-allowed border-line bg-surface text-cocoa/50"
        }`}
      >
        Review wrong{hasWrong ? ` (${wrongTotal})` : ""}
      </button>
      <button
        onClick={() => {
          if (window.confirm("Reset all progress in this deck? This can't be undone.")) onReset();
        }}
        className="px-2 py-1.5 text-[0.8rem] font-semibold text-cocoa underline-offset-2 transition hover:text-red hover:underline"
      >
        Reset
      </button>
    </div>
  );
}

/* ---------- the study sheet ---------- */

export function sheetShell(tone: Tone) {
  return `study-sheet animate-fade overflow-hidden rounded-panel border transition-colors duration-300 ${
    tone === "correct"
      ? "sheet-correct border-green-line bg-green-bg"
      : tone === "wrong"
      ? "sheet-wrong border-red-line bg-red-bg"
      : "sheet-neutral border-line bg-surface"
  }`;
}

/** Context line above the question: UNIT · LESSON · position (Sol #20, #24). */
export function ContextLine({
  tone, index, total, unitLabel, lessonTitle,
}: {
  tone: Tone;
  index: number;
  total: number;
  unitLabel?: string;
  lessonTitle?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3 transition-colors duration-300 ${
        tone === "correct" ? "bg-green-bg/70" : tone === "wrong" ? "bg-red-bg/70" : "bg-deep/25"
      }`}
    >
      <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-cocoa">
        {unitLabel ? `${unitLabel} · ` : ""}Question {index} of {total}
      </span>
      {lessonTitle && (
        <span lang="dv" dir="rtl" className="thaana text-[0.86rem] font-semibold text-coffee">
          {lessonTitle}
        </span>
      )}
    </div>
  );
}

/* ---------- bottom sheet navigator (focus-trapped) ---------- */

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  open, onClose, title, subtitle, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !sheetRef.current) return;
      const els = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus();
    };
  }, [mounted, open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/45 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-panel border-t shadow-[0_-18px_44px_-20px_rgba(0,0,0,.55)] transition-transform duration-300 ${shown ? "translate-y-0" : "translate-y-full"}`}
        style={{ transitionTimingFunction: "cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="border-b border-line px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-[4px] w-[44px] rounded-full bg-line" aria-hidden />
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[1.15rem] font-bold">{title}</h3>
            <button
              ref={closeRef}
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-ctl text-cocoa hover:bg-raised hover:text-coffee"
              aria-label="Close navigator"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {subtitle && <div className="mt-0.5 text-[0.82rem] text-cocoa">{subtitle}</div>}
        </div>
        <div className="overflow-y-auto px-5 pb-6 pt-4">{children}</div>
      </div>
    </>
  );
}

export function NavLegend() {
  const L = ({ swatch, label }: { swatch: string; label: string }) => (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded-[4px] border ${swatch}`} aria-hidden /> {label}
    </span>
  );
  return (
    <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3.5 text-[0.78rem] font-semibold text-cocoa">
      <L swatch="bg-teal border-teal" label="Current" />
      <L swatch="bg-green-bg border-green-line" label="Right" />
      <L swatch="bg-red-bg border-red-line" label="Wrong" />
      <L swatch="bg-cream border-line" label="Not answered" />
    </div>
  );
}

/* ---------- completion: useful, not celebratory (Sol #28) ---------- */

export function CompleteCard({
  correct, wrong, total, onReviewWrong, onRestart, homeHref,
}: {
  correct: number;
  wrong: number;
  total: number;
  onReviewWrong: () => void;
  onRestart: () => void;
  homeHref: string;
}) {
  return (
    <div className="animate-rise rounded-panel border border-line bg-surface p-8 text-center">
      <div className="flex justify-center">
        <KoelMark size={28} className="text-cocoa" />
      </div>
      <h3 className="mt-3 font-display text-[1.5rem] font-extrabold">
        {total} reviewed
      </h3>
      <p className="mt-1 text-[0.95rem] text-cocoa">
        <b className="text-green">{correct} right</b>
        <span className="mx-2 opacity-50">·</span>
        <b className="text-red">{wrong} to review</b>
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {wrong > 0 && (
          <button
            onClick={onReviewWrong}
            className="rounded-ctl bg-teal px-6 py-3 font-bold text-accent-ink transition hover:bg-teal-deep hover:-translate-y-px"
          >
            Review {wrong}
          </button>
        )}
        <button
          onClick={onRestart}
          className={`rounded-ctl px-6 py-3 font-bold transition ${
            wrong > 0
              ? "glass-control border text-coffee-deep hover:border-teal/60"
              : "bg-teal text-accent-ink hover:bg-teal-deep"
          }`}
        >
          Study again
        </button>
        <a
          href={homeHref}
          className="px-3 py-3 text-[0.9rem] font-semibold text-cocoa underline-offset-2 hover:text-coffee hover:underline"
        >
          Back to units
        </a>
      </div>
    </div>
  );
}

/* ---------- actions ---------- */

export function RevealButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        onClick={onClick}
        className="rounded-ctl bg-teal px-7 py-3 font-bold text-accent-ink transition hover:bg-teal-deep hover:-translate-y-px active:translate-y-px"
      >
        Reveal answer
      </button>
    </div>
  );
}

export function MarkButtons({ status, onMark }: { status?: Mark; onMark: (correct: boolean) => void }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2.5">
      <button
        onClick={() => onMark(false)}
        aria-pressed={status === "wrong"}
        className={`inline-flex items-center gap-2 rounded-ctl border px-5 py-2.5 font-bold transition ${
          status === "wrong" ? "border-red bg-red text-cream" : "border-red-line bg-red-bg text-red hover:border-red"
        }`}
      >
        <X className="h-4 w-4" aria-hidden /> Got it wrong
      </button>
      <button
        onClick={() => onMark(true)}
        aria-pressed={status === "correct"}
        className={`inline-flex items-center gap-2 rounded-ctl border px-5 py-2.5 font-bold transition ${
          status === "correct" ? "border-green bg-green text-cream" : "border-green-line bg-green-bg text-green hover:border-green"
        }`}
      >
        <Check className="h-4 w-4" aria-hidden /> Got it right
      </button>
    </div>
  );
}

export function NextButton({ isLast, onClick }: { isLast: boolean; onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        className="glass-control rounded-ctl border px-6 py-2.5 font-bold text-coffee-deep transition hover:border-teal/60"
      >
        {isLast ? "See how you did" : "Next question →"}
      </button>
    </div>
  );
}

/* ---------- sticky mobile action bar (Sol #25) ---------- */

export function MobileActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="glass-panel fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-2.5 sm:hidden"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[480px] items-center justify-center gap-2.5 [&>div]:mt-0 [&>div]:flex-1 [&_button]:w-full">
        {children}
      </div>
    </div>
  );
}
