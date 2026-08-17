/**
 * Tiny scroll signature without JavaScript scroll work.
 *
 * The old implementation listened to every scroll event and wrote an inherited
 * CSS custom property on <html>. On large pages that can invalidate styles far
 * beyond the 2px progress bar. Modern Chromium can drive the transform directly
 * from the compositor via a scroll timeline; browsers without support simply
 * omit the decorative progress line.
 */
export function AmbientMotion() {
  return <div className="koveline-scroll-progress" aria-hidden />;
}
