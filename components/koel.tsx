/**
 * The Koveline koel and its flight line.
 *
 * The bird appears fully at meaningful moments only: navbar mark, deck
 * completion, and empty states. The flight line (curve ending in a coral
 * dot) is the site's recurring signature and may appear more often. The
 * bird itself is a featureless silhouette by design — no eye, no face.
 */

export function KoelMark({
  size = 30,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path
        d="M54 50 C 43 38, 27 28, 9 24 C 25 34, 37 44, 47 57 C 49 54, 51 52, 54 50 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M104 25 L 92 24 C 85 23.5, 78 26, 73 31 L 66 38 C 58 45, 51 53, 45 62 C 37 74, 28 88, 19 103 C 33 87, 45 74, 54 64 C 61 57, 68 51, 76 45 L 87 37 C 92 33.5, 96 30, 99 27.5 Z"
        fill="currentColor"
      />
      <path
        d="M67 42 C 62 27, 52 12, 33 2 C 45 17, 53 33, 57 50 C 60 47, 63 44, 67 42 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Curved flight line ending in a coral dot. Scales to its container. */
export function FlightLine({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M2 12 C 60 4, 130 4, 186 10"
        stroke="#12716b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="192" cy="10" r="4.5" fill="#d65f45" />
    </svg>
  );
}
