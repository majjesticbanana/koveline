"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookMarked, ChevronDown, ListChecks } from "lucide-react";
import { KoelMark } from "./koel";
import { SettingsPanel } from "./settings-panel";
import { NavAccount } from "./nav-account";
import siteCopy from "@/content/site-copy.json";

/**
 * One menu, three controls.
 *
 * The bar used to carry an "Explore" menu *and* a "Start studying" button that
 * led to the same place, plus a "Question banks" row inside the menu that led
 * there as well. Everything you can study now sits behind the single Study
 * menu, and the wordmark is the way home.
 */

const courses = [
  { label: "Grade 9", href: "/islam/grade-9/mixed", meta: "389 questions" },
  { label: "Grade 10", href: "/islam/grade-10/mixed", meta: "333 questions" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="site-navbar sticky top-0 z-50 border-b border-line bg-cream">
      <div className="site-navbar-inner mx-auto flex h-[64px] max-w-[960px] items-center justify-between px-[20px]">
        <Link href="/" className="site-brand group flex items-center gap-2.5" aria-label={`${siteCopy.brand.name} home`}>
          <KoelMark
            size={30}
            className="text-ink transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
          <span className="site-wordmark font-display text-[1.3rem] font-extrabold tracking-tight text-ink">
            {siteCopy.brand.wordmarkStart}<span className="text-teal">{siteCopy.brand.wordmarkAccent}</span>
          </span>
        </Link>

        <nav className="nav-actions flex items-center gap-2" aria-label="Main">
          <div ref={menuRef} className="nav-menu relative">
            <button
              type="button"
              className="nav-menu-trigger glass-control inline-flex items-center gap-1.5 rounded-ctl border px-3.5 py-2 text-[0.84rem] font-bold text-ink transition hover:border-teal/70"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {siteCopy.navigation.menu}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            <div
              className={`nav-dropdown glass-panel ${open ? "is-open" : ""}`}
              role="menu"
              aria-label={siteCopy.navigation.menuAria}
            >
              <div className="nav-dropdown-section">
                <div className="nav-dropdown-label">{siteCopy.navigation.subjectsLabel}</div>
                <div className="nav-course-grid">
                  {courses.map((course) => (
                    <Link
                      key={course.href}
                      href={course.href}
                      role="menuitem"
                      className="nav-course-link"
                      onClick={() => setOpen(false)}
                    >
                      <strong>{course.label}</strong>
                      <span>{course.meta}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="nav-dropdown-section nav-resources-section">
                <div className="nav-dropdown-label">{siteCopy.navigation.moreLabel}</div>
                <Link href="/test" role="menuitem" className="nav-resource-row" onClick={() => setOpen(false)}>
                  <span className="nav-dropdown-icon"><ListChecks className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <strong>{siteCopy.navigation.customTestTitle}</strong>
                    <span>{siteCopy.navigation.customTestBody}</span>
                  </div>
                </Link>
                <Link href="/textbooks" role="menuitem" className="nav-resource-row" onClick={() => setOpen(false)}>
                  <span className="nav-dropdown-icon"><BookMarked className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <strong>{siteCopy.navigation.textbooksTitle}</strong>
                    <span>{siteCopy.navigation.textbooksBody}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <NavAccount />
          <SettingsPanel />
        </nav>
      </div>
    </header>
  );
}
