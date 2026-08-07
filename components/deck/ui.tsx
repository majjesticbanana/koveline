"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, Save, Grid3X3 } from "lucide-react";
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
    <div className="study-statbar mb-3 flex flex-wrap items-center justify-center gap-2 text-[0.85rem]">
      <button
        onClick={onOpenNav}
        className="question-jump-trigger glass-control inline-flex items-center gap-1.5 rounded-ctl border px-3 py-1.5 font-semibold text-coffee-deep transition hover:border-teal/60"
        aria-label={`Open the question navigator — question ${index} of ${total}`}
      >
        <Grid3X3 className="question-jump-icon h-3.5 w-3.5 text-cocoa" aria-hidden />
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

export function ProgressBar({
  marks, index,
}: {
  /** Statuses in the *current deck order*. Random mode therefore follows the shuffled order. */
  marks: Array<Mark | undefined>;
  /** Zero-based position in the current deck order. */
  index: number;
}) {
  const total = marks.length;
  const safeIndex = total ? Math.min(Math.max(index, 0), total - 1) : 0;
  const markerPct = total ? ((safeIndex + 0.5) / total) * 100 : 0;

  return (
    <div
      className="question-progress relative mb-4 h-[6px] overflow-visible rounded-full bg-latte"
      role="progressbar"
      aria-valuenow={total ? safeIndex + 1 : 0}
      aria-valuemin={total ? 1 : 0}
      aria-valuemax={total}
      aria-valuetext={total ? `Question ${safeIndex + 1} of ${total}` : "No questions"}
      aria-label="Current position in this deck"
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-full" aria-hidden>
        {marks.map((mark, i) => (
          <i
            // Index is intentional: this bar represents positions in this session order.
            key={i}
            className={`block h-full min-w-0 flex-1 transition-colors duration-300 ${
              mark === "correct" ? "bg-green" : mark === "wrong" ? "bg-red" : "bg-transparent"
            }`}
          />
        ))}
      </div>
      {total > 0 && (
        <i
          aria-hidden
          className="question-progress-current pointer-events-none absolute top-1/2 z-10 h-[12px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-[left] duration-300"
          style={{ left: `${markerPct}%` }}
        />
      )}
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
        seg === m ? "bg-[rgba(198,99,64,.16)] text-caramel shadow-[inset_0_0_0_1px_rgba(198,99,64,.24)]" : "text-coffee-deep hover:bg-raised"
      }`}
    >
      {label}
    </button>
  );
  const hasWrong = wrongTotal > 0;
  return (
    <div className="study-modebar mb-4 flex flex-wrap items-center justify-center gap-2.5">
      <div
        role="group"
        aria-label="Question order"
        className="order-segment glass-control flex overflow-hidden rounded-ctl border"
      >
        {segBtn("sequential", "In order")}
        <span className="w-px bg-line" aria-hidden />
        {segBtn("random", "Random")}
      </div>
      <button
        onClick={() => hasWrong && onMode("wrongOnly")}
        disabled={!hasWrong}
        aria-pressed={mode === "wrongOnly"}
        className={`review-mode rounded-ctl border px-3.5 py-1.5 text-[0.84rem] font-bold transition ${
          mode === "wrongOnly"
            ? "border-red bg-red-bg text-red shadow-[inset_0_0_0_1px_rgba(238,138,128,.20)]"
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
        className="reset-mode px-2 py-1.5 text-[0.8rem] font-semibold text-cocoa underline-offset-2 transition hover:text-red hover:underline"
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
      className={`study-context-line flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3 transition-colors duration-300 ${
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
  open, onClose, title, subtitle, children, variant = "sheet", bodyClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  variant?: "sheet" | "dialog";
  bodyClassName?: string;
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

  if (!mounted || typeof document === "undefined") return null;

  const panel = (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`${variant === "dialog" ? "question-dialog" : "bottom-sheet fixed"} glass-panel z-[90] flex flex-col ${shown ? "is-shown" : ""}`}
    >
      <div className="bottom-sheet-head border-b border-line px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
        <div className="bottom-sheet-handle mx-auto mb-2.5 h-[4px] w-[44px] rounded-full bg-line sm:mb-3" aria-hidden />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[1.08rem] font-bold sm:text-[1.15rem]">{title}</h3>
            {subtitle && <div className="mt-0.5 truncate text-[0.76rem] text-cocoa sm:text-[0.82rem]">{subtitle}</div>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-ctl text-cocoa transition hover:bg-raised hover:text-coffee"
            aria-label="Close navigator"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className={`bottom-sheet-body overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-6 sm:pt-4 ${bodyClassName}`}>{children}</div>
    </div>
  );

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`bottom-sheet-backdrop fixed inset-0 z-[80] transition-opacity duration-300 ${shown ? "is-shown" : ""}`}
      />
      {variant === "dialog" ? (
        <div className={`question-dialog-stage fixed inset-0 z-[90] grid place-items-center ${shown ? "is-shown" : ""}`}>
          {panel}
        </div>
      ) : panel}
    </>,
    document.body,
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
      <L swatch="bg-[rgba(247,232,223,.08)] border-ink" label="Current" />
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
        className="reveal-action rounded-ctl bg-teal px-7 py-3 font-bold text-accent-ink transition hover:bg-teal-deep hover:-translate-y-px active:translate-y-px"
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
        className={`mark-action inline-flex items-center gap-2 rounded-ctl border px-5 py-2.5 font-bold transition ${
          status === "wrong" ? "border-red bg-red text-cream" : "border-red-line bg-red-bg text-red hover:border-red"
        }`}
      >
        <X className="h-4 w-4" aria-hidden /> Got it wrong
      </button>
      <button
        onClick={() => onMark(true)}
        aria-pressed={status === "correct"}
        className={`mark-action inline-flex items-center gap-2 rounded-ctl border px-5 py-2.5 font-bold transition ${
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
        className="next-action glass-control rounded-ctl border px-6 py-2.5 font-bold text-coffee-deep transition hover:border-teal/60"
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
      className="mobile-action-bar glass-panel fixed inset-x-0 bottom-0 z-30 border-t px-3 pt-2.5 sm:hidden"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-[480px] items-center justify-center gap-2.5 [&>div]:mt-0 [&>div]:flex-1 [&_button]:w-full">
        {children}
      </div>
    </div>
  );
}
