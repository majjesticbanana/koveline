"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn } from "lucide-react";

/**
 * A scan of the real paper.
 *
 * The images are ink on white, so they sit on a paper panel rather than the
 * dark ground — the same split the textbooks use, and it keeps them legible
 * in every theme.
 *
 * Small print on a phone is the real problem, so tapping opens a full-screen
 * viewer that the browser will pinch-zoom natively. That is far more reliable
 * than a hand-rolled transform, and it inherits the platform's own gestures.
 */
export function Scan({
  src, width, height, alt, className = "",
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // Esc closes, and is swallowed so the deck below does not also act on it
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`scan ${className}`}
        aria-label={`${alt} — tap to enlarge`}
      >
        <img src={src} width={width} height={height} alt={alt} loading="lazy" decoding="async" />
        <span className="scan-zoom" aria-hidden>
          <ZoomIn className="h-3.5 w-3.5" />
        </span>
      </button>

      {open && (
        <div className="scan-viewer" role="dialog" aria-modal="true" aria-label={alt}>
          <button type="button" className="scan-close" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="scan-viewer-inner">
            <img src={src} width={width} height={height} alt={alt} />
          </div>
          <p className="scan-hint">Pinch or scroll to zoom · tap outside to close</p>
          <button type="button" className="scan-backdrop" onClick={() => setOpen(false)} aria-hidden tabIndex={-1} />
        </div>
      )}
    </>
  );
}
