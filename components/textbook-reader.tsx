"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";

/**
 * The two curriculum textbooks.
 *
 * Performance is the whole design here. Each file is ~23 MB, so:
 *  - the <iframe> is NOT rendered until the reader asks for it, meaning
 *    visiting this page downloads nothing;
 *  - the PDFs are linearised, so the browser's viewer streams them with
 *    range requests and shows page 1 long before the file has arrived;
 *  - the service worker skips /textbooks/ entirely, so nothing is cached
 *    and partial loading is never defeated;
 *  - on phones we hand off to the native PDF viewer, which is both faster
 *    and far more usable than an iframe on iOS.
 */
const BOOKS = [
  {
    id: "grade-9",
    title: "Islam · Grade 9",
    titleDhivehi: "އިސްލާމް - ގްރޭޑް 9",
    file: "/textbooks/islam-grade-9.pdf",
    pages: 260,
    size: "23 MB",
  },
  {
    id: "grade-10",
    title: "Islam · Grade 10",
    titleDhivehi: "އިސްލާމް - ގްރޭޑް 10",
    file: "/textbooks/islam-grade-10.pdf",
    pages: 270,
    size: "23 MB",
  },
];

export function TextbookReader() {
  const [open, setOpen] = useState<string | null>(null);
  const [smallScreen, setSmallScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const sync = () => setSmallScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="tb-grid">
      {BOOKS.map((b) => {
        const isOpen = open === b.id;
        return (
          <section key={b.id} className={`tb-card ${isOpen ? "is-open" : ""}`}>
            <div className="tb-head">
              <span className="tb-icon" aria-hidden>
                <BookOpen className="h-5 w-5" />
              </span>
              <div className="tb-titles">
                <h2 lang="dv" dir="rtl" className="thaana tb-dv">
                  {b.titleDhivehi}
                </h2>
                <p className="tb-en">{b.title}</p>
              </div>
              <span className="tb-meta">
                {b.pages} pages · {b.size}
              </span>
            </div>

            <div className="tb-actions">
              {smallScreen ? (
                <a className="tb-btn tb-btn-primary" href={b.file} target="_blank" rel="noopener">
                  Open textbook <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : isOpen ? (
                <button type="button" className="tb-btn" onClick={() => setOpen(null)}>
                  Close <X className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  className="tb-btn tb-btn-primary"
                  onClick={() => setOpen(b.id)}
                >
                  Read here
                </button>
              )}
              <a className="tb-btn" href={b.file} target="_blank" rel="noopener">
                Open in new tab
              </a>
            </div>

            {/* Mounted only on request — until then this page downloads nothing. */}
            {isOpen && !smallScreen && (
              <div className="tb-frame">
                <iframe
                  src={`${b.file}#view=FitH`}
                  title={`${b.title} textbook`}
                  loading="lazy"
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
