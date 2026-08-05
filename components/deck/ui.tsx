"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check, X, Shuffle, ListOrdered, AlertCircle, RotateCcw, Save,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { KoelMark, FlightLine } from "@/components/koel";

export type Mode = "random" | "sequential" | "wrongOnly";
export type Mark = "correct" | "wrong";
export type Tone = "" | "correct" | "wrong";

/* ---------- tiny bits ---------- */

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-basalt-line bg-basalt-2 px-1.5 py-0.5 font-display text-[0.74rem] font-bold text-on-dark-dim">
      {children}
    </kbd>
  );
}

export function KbdHints() {
  return (
    <p className="mt-4 hidden text-center text-[0.78rem] text-on-dark-dim sm:block">
      <Kbd>Space</Kbd> reveal / next · <Kbd>←</Kbd> <Kbd>→</Kbd> move · <Kbd>R</Kbd>/<Kbd>W</Kbd> mark
      · <Kbd>Esc</Kbd> close
    </p>
  );
}

export function SaveHint() {
  return (
    <div className="mb-4 flex items-center justify-center gap-1.5 text-[0.78rem] text-on-dark-dim">
      <Save className="h-3 w-3 opacity-70" aria-hidden /> Progress saves on this device
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-[5px] border ${swatch}`} aria-hidden />
      {label}
    </span>
  );
}

/* ---------- stat bar + progress ---------- */

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
    <div className="mb-4 flex flex-wrap justify-center gap-[10px]">
      <button
        onClick={onOpenNav}
        className="inline-flex items-center gap-2.5 rounded-[13px] border border-basalt-line bg-basalt-2 px-4 py-2.5 font-semibold text-on-dark transition hover:border-brass/60"
        aria-label={`Open the question navigator — question ${index} of ${total}`}
      >
        <span className="text-[0.9rem] text-on-dark-dim">Question</span>
        <span className="font-display font-bold text-brass">{index}</span>
        <span className="text-on-dark-dim">/</span>
        <span className="font-bold">{total}</span>
      </button>
      <span
        className="inline-flex items-center gap-2 rounded-[13px] border border-green/45 bg-green/15 px-4 py-2.5 font-display font-bold text-green-line"
        aria-label={`${correct} marked right`}
      >
        <Check className="h-4 w-4" aria-hidden /> {correct}
      </span>
      <span
        className="inline-flex items-center gap-2 rounded-[13px] border border-red/45 bg-red/15 px-4 py-2.5 font-display font-bold text-red-line"
        aria-label={`${wrong} marked wrong`}
      >
        <X className="h-4 w-4" aria-hidden /> {wrong}
      </span>
    </div>
  );
}

export function ProgressBar({ correct, wrong, total }: { correct: number; wrong: number; total: number }) {
  const cPct = total ? (correct / total) * 100 : 0;
  const wPct = total ? (wrong / total) * 100 : 0;
  return (
    <div
      className="mb-[18px] flex h-[8px] overflow-hidden rounded-full bg-basalt-3"
      role="progressbar"
      aria-valuenow={Math.round(cPct + wPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress through this deck"
    >
      <i className="block h-full bg-teal transition-[width] duration-500" style={{ width: `${cPct}%` }} />
      <i className="block h-full bg-red transition-[width] duration-500" style={{ width: `${wPct}%` }} />
    </div>
  );
}

/* ---------- mode bar ---------- */

export function ModeBar({
  mode, wrongTotal, onMode, onReset,
}: {
  mode: Mode;
  wrongTotal: number;
  onMode: (m: Mode) => void;
  onReset: () => void;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-[11px] border px-[15px] py-2.5 text-[0.9rem] font-bold transition";
  const off = "border-basalt-line bg-basalt-2 text-on-dark hover:border-brass/60";
  const on = "border-brass bg-brass text-basalt";
  return (
    <div className="mb-[18px] flex flex-wrap justify-center gap-[9px]" role="group" aria-label="Study mode">
      <button onClick={() => onMode("random")} className={`${base} ${mode === "random" ? on : off}`} aria-pressed={mode === "random"}>
        <Shuffle className="h-4 w-4" aria-hidden /> Random
      </button>
      <button onClick={() => onMode("sequential")} className={`${base} ${mode === "sequential" ? on : off}`} aria-pressed={mode === "sequential"}>
        <ListOrdered className="h-4 w-4" aria-hidden /> In order
      </button>
      <button onClick={() => onMode("wrongOnly")} className={`${base} ${mode === "wrongOnly" ? on : off}`} aria-pressed={mode === "wrongOnly"}>
        <AlertCircle className="h-4 w-4" aria-hidden /> Review wrong ({wrongTotal})
      </button>
      <button onClick={onReset} className={`${base} border-basalt-line bg-basalt-2 text-on-dark-dim hover:border-brass/60`}>
        <RotateCcw className="h-4 w-4" aria-hidden /> Reset
      </button>
    </div>
  );
}

/* ---------- study sheet chrome ---------- */

export function sheetShell(tone: Tone) {
  return `animate-fade overflow-hidden rounded-card border-b-[3px] text-ink shadow-lift transition-colors duration-300 ${
    tone === "correct"
      ? "border-green bg-[#f2f6e9]"
      : tone === "wrong"
      ? "border-red bg-[#f8ebe4]"
      : "border-brass bg-surface"
  }`;
}

export function SheetHeader({
  tone, index, total, stamp, canPrev, canNext, onPrev, onNext,
}: {
  tone: Tone;
  index: number;
  total: number;
  stamp: React.ReactNode;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const navBtn =
    "grid h-[34px] w-[34px] place-items-center rounded-[9px] text-cocoa hover:bg-black/5 hover:text-coffee disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      className={`flex items-center justify-between border-b border-line px-[18px] py-3.5 transition-colors duration-300 ${
        tone === "correct" ? "bg-green-bg" : tone === "wrong" ? "bg-red-bg" : "bg-brass-soft/70"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button onClick={onPrev} disabled={!canPrev} className={navBtn} aria-label="Previous question">
          <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
        </button>
        <span
          className={`font-display text-[0.8rem] font-bold uppercase tracking-[0.1em] ${
            tone === "correct" ? "text-green" : tone === "wrong" ? "text-red" : "text-coffee-deep"
          }`}
        >
          Question {String(index).padStart(2, "0")}
          <span className="opacity-50"> / {total}</span>
        </span>
        <button onClick={onNext} disabled={!canNext} className={navBtn} aria-label="Next question">
          <ChevronRight className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </div>
      {stamp}
    </div>
  );
}

/** Stamp-style badge for the sheet header (lesson or unit). */
export function Stamp({ children, rtl = false }: { children: React.ReactNode; rtl?: boolean }) {
  return (
    <span
      dir={rtl ? "rtl" : undefined}
      lang={rtl ? "dv" : undefined}
      className={`${rtl ? "thaana" : "font-display"} rounded-[9px] border border-dashed border-brass-deep/70 bg-white/50 px-3 py-1.5 text-[0.8rem] font-semibold text-coffee-deep`}
    >
      {children}
    </span>
  );
}

/* ---------- bottom sheet navigator ---------- */

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Mounted only while open (plus its exit transition), so its contents are
 * never in the tab order when closed. Traps focus while open and restores
 * it to the trigger on close.
 */
export function BottomSheet({
  open, onClose, title, subtitle, children, headerExtra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
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
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const els = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (els.length === 0) return;
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
        className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-sheet border-t border-basalt-line bg-basalt-2 text-on-dark shadow-[0_-20px_50px_-20px_rgba(0,0,0,.8)] transition-transform duration-300 ${shown ? "translate-y-0" : "translate-y-full"}`}
        style={{ transitionTimingFunction: "cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="border-b border-basalt-line px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-[5px] w-[46px] rounded-full bg-basalt-line" aria-hidden />
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[1.2rem] font-bold">{title}</h3>
            <button
              ref={closeRef}
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-on-dark-dim hover:bg-white/10 hover:text-on-dark"
              aria-label="Close navigator"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {subtitle && <div className="mt-1 text-[0.84rem] text-on-dark-dim">{subtitle}</div>}
          {headerExtra}
        </div>
        <div className="overflow-y-auto px-5 pb-6 pt-[18px]">{children}</div>
      </div>
    </>
  );
}

export function NavLegend() {
  return (
    <div className="mt-[18px] flex flex-wrap gap-4 border-t border-basalt-line pt-4 text-[0.8rem] font-semibold text-on-dark-dim">
      <Legend swatch="bg-brass border-brass" label="Current" />
      <Legend swatch="bg-green/25 border-green/50" label="Right" />
      <Legend swatch="bg-red/25 border-red/50" label="Wrong" />
      <Legend swatch="bg-basalt-3 border-basalt-line" label="Not answered" />
    </div>
  );
}

/* ---------- completion (a koel moment) ---------- */

export function CompleteCard({
  correct, wrong, total, actions,
}: {
  correct: number;
  wrong: number;
  total: number;
  actions: React.ReactNode;
}) {
  const score = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="relative animate-rise overflow-hidden rounded-card border border-basalt-line bg-basalt-2 p-10 text-center text-on-dark shadow-lift">
      <div className="flex justify-center">
        <KoelMark size={76} className="text-brass" title="The Koveline koel" />
      </div>
      <h3 className="mb-1 mt-4 font-display text-[1.8rem] font-bold text-on-dark">You made it through.</h3>
      <p className="mb-5 text-[0.95rem] text-on-dark-dim">
        {wrong > 0
          ? `${wrong} question${wrong === 1 ? "" : "s"} to look at again — that's where the marks are.`
          : correct === total && total > 0
          ? "Every question, marked right. Come back tomorrow and see if it holds."
          : "Mark yourself honestly and the review list does the rest."}
      </p>
      <div className="mx-auto mb-6 w-40">
        <FlightLine className="h-4 w-full" />
      </div>
      <div className="mb-7 flex flex-wrap justify-center gap-[34px]">
        <DoneStat value={correct} label="Right" color="text-green-line" />
        <DoneStat value={wrong} label="Wrong" color="text-red-line" />
        <DoneStat value={`${score}%`} label="Score" color="text-brass" />
      </div>
      <div className="flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

function DoneStat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div>
      <b className={`block font-display text-[2.2rem] font-bold leading-none ${color}`}>{value}</b>
      <span className="text-[0.76rem] font-bold uppercase tracking-wide text-on-dark-dim">{label}</span>
    </div>
  );
}

/* ---------- controls ---------- */

export function RevealButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-[22px] flex justify-center">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-[14px] bg-brass px-7 py-3.5 font-extrabold text-basalt shadow-warm-sm transition hover:bg-brass-deep active:translate-y-px"
      >
        Reveal answer
      </button>
    </div>
  );
}

export function MarkButtons({ status, onMark }: { status?: Mark; onMark: (correct: boolean) => void }) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-[11px]">
      <button
        onClick={() => onMark(false)}
        aria-pressed={status === "wrong"}
        className={`inline-flex items-center gap-2 rounded-[13px] border px-[22px] py-3 font-extrabold transition ${
          status === "wrong" ? "border-red bg-red text-white" : "border-red/50 bg-red/15 text-red-line hover:bg-red/25"
        }`}
      >
        <X className="h-4 w-4" aria-hidden /> Got it wrong
      </button>
      <button
        onClick={() => onMark(true)}
        aria-pressed={status === "correct"}
        className={`inline-flex items-center gap-2 rounded-[13px] border px-[22px] py-3 font-extrabold transition ${
          status === "correct" ? "border-green bg-green text-white" : "border-green/50 bg-green/15 text-green-line hover:bg-green/25"
        }`}
      >
        <Check className="h-4 w-4" aria-hidden /> Got it right
      </button>
    </div>
  );
}

export function NextButton({ isLast, onClick }: { isLast: boolean; onClick: () => void }) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-[14px] border border-basalt-line bg-basalt-3 px-7 py-3.5 font-extrabold text-on-dark transition hover:border-brass/60"
      >
        {isLast ? "See how you did" : "Next question →"}
      </button>
    </div>
  );
}
