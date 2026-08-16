"use client";

import { useEffect } from "react";

/**
 * Ambient layer + scroll signature.
 *
 * The pointer-following glow is gone: a static gradient dragged around by the
 * cursor read as a flashlight, did nothing on touch devices, and cost a
 * listener on every move. The warmth now drifts on its own in CSS
 * (`.koveline-aurora`) as a compositor-only animation, so it is alive without
 * costing a frame.
 *
 * This component keeps only what genuinely needs JavaScript: the scroll
 * progress ratio, and the small tilt on the active card. Both are
 * rAF-throttled and both stand down under reduced motion or performance mode.
 */
export function AmbientMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** Settings are on <html>; re-read per event so changes apply instantly. */
    const motionOff = () =>
      root.dataset.perf === "on" || root.dataset.motion === "off" || prefersReduced;
    const tiltAllowed = () => fine && !motionOff() && root.dataset.motion !== "reduced";

    let active: HTMLElement | null = null;
    let pointerFrame = 0;
    let scrollFrame = 0;
    let lastX = 0;
    let lastY = 0;
    let pointerTarget: EventTarget | null = null;

    const resetActive = () => {
      if (!active) return;
      active.style.setProperty("--rx", "0deg");
      active.style.setProperty("--ry", "0deg");
      active = null;
    };

    const paintPointer = () => {
      pointerFrame = 0;
      if (!tiltAllowed()) {
        resetActive();
        return;
      }
      const target = (pointerTarget as HTMLElement | null)?.closest?.(
        "[data-tilt]",
      ) as HTMLElement | null;
      if (target !== active) {
        resetActive();
        active = target;
      }
      if (!target) return;
      const r = target.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (lastX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (lastY - r.top) / r.height));
      target.style.setProperty("--ry", `${((x - 0.5) * 0.52).toFixed(3)}deg`);
      target.style.setProperty("--rx", `${((0.5 - y) * 0.52).toFixed(3)}deg`);
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
      root.style.setProperty("--scroll-progress", (max > 0 ? window.scrollY / max : 0).toFixed(4));
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScroll);
    };
    const onPointerOut = (e: PointerEvent) => {
      if (!(e.relatedTarget as Node | null)) resetActive();
    };

    if (fine) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerout", onPointerOut, { passive: true });
    }
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
      <div className="koveline-aurora" aria-hidden>
        <i />
        <i />
      </div>
      <div className="koveline-scroll-progress" aria-hidden />
    </>
  );
}
