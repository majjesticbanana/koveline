"use client";

import { useEffect } from "react";

/**
 * Global low-amplitude motion layer.
 * No custom cursor, no scroll-jacking: it only updates CSS variables.
 */
export function AmbientMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let active: HTMLElement | null = null;

    const resetActive = () => {
      if (!active) return;
      active.style.setProperty("--rx", "0deg");
      active.style.setProperty("--ry", "0deg");
      active = null;
    };

    const onPointer = (e: PointerEvent) => {
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
      if (!fine || reduced) return;

      const target = (e.target as HTMLElement | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (target !== active) {
        resetActive();
        active = target;
      }
      if (!target) return;

      const r = target.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      target.style.setProperty("--ry", `${((x - .5) * .7).toFixed(3)}deg`);
      target.style.setProperty("--rx", `${((.5 - y) * .7).toFixed(3)}deg`);
      target.style.setProperty("--cx", `${(x * 100).toFixed(1)}%`);
      target.style.setProperty("--cy", `${(y * 100).toFixed(1)}%`);
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      root.style.setProperty("--scroll-progress", `${pct.toFixed(2)}%`);
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!(e.relatedTarget as Node | null)) resetActive();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll);
      resetActive();
    };
  }, []);

  return <div className="koveline-scroll-progress" aria-hidden />;
}
