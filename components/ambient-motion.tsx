"use client";

import { useEffect, useRef } from "react";

/**
 * Low-cost ambient motion.
 * Pointer work is rAF-throttled; the ambient glow is a translated compositor layer,
 * not a full-page background repaint. Tilt is only calculated for the active card.
 */
export function AmbientMotion() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const glow = glowRef.current;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let active: HTMLElement | null = null;
    let pointerFrame = 0;
    let scrollFrame = 0;
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 3;
    let pointerTarget: EventTarget | null = null;

    const resetActive = () => {
      if (!active) return;
      active.style.setProperty("--rx", "0deg");
      active.style.setProperty("--ry", "0deg");
      active = null;
    };

    const paintPointer = () => {
      pointerFrame = 0;

      if (glow && fine && !reduced) {
        glow.style.transform = `translate3d(${Math.round(lastX)}px, ${Math.round(lastY)}px, 0)`;
      }

      if (!fine || reduced) return;

      const target = (pointerTarget as HTMLElement | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (target !== active) {
        resetActive();
        active = target;
      }
      if (!target) return;

      const r = target.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (lastX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (lastY - r.top) / r.height));
      target.style.setProperty("--ry", `${((x - .5) * .52).toFixed(3)}deg`);
      target.style.setProperty("--rx", `${((.5 - y) * .52).toFixed(3)}deg`);
      target.style.setProperty("--cx", `${(x * 100).toFixed(1)}%`);
      target.style.setProperty("--cy", `${(y * 100).toFixed(1)}%`);
    };

    const onPointer = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      pointerTarget = e.target;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    };

    const paintScroll = () => {
      scrollFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      root.style.setProperty("--scroll-progress", ratio.toFixed(4));
    };

    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScroll);
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!(e.relatedTarget as Node | null)) resetActive();
    };

    if (!fine || reduced) glow?.setAttribute("hidden", "");

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    paintScroll();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll);
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      resetActive();
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="koveline-pointer-glow" aria-hidden />
      <div className="koveline-scroll-progress" aria-hidden />
    </>
  );
}
