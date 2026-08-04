/**
 * The Koveline koel and its flight line.
 *
 * The bird appears fully at meaningful moments only: navbar mark, deck
 * completion, and empty states. The flight line (curve ending in the coral
 * eye-dot) is the site's recurring signature and may appear more often.
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
        d="M56 50 C 45 36, 28 25, 10 22 C 27 33, 39 45, 49 58 C 51 55, 53 52, 56 50 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M103 27 L 92 25 C 86 24, 80 26, 76 30 L 69 36 C 61 42, 54 49, 48 57 C 40 68, 31 82, 20 100 C 34 85, 46 73, 55 63 C 61 57, 68 51, 75 46 L 85 39 C 89 36, 92 33, 94 30 Z"
        fill="currentColor"
      />
      <path
        d="M64 44 C 59 28, 48 12, 28 3 C 41 20, 50 37, 55 53 C 58 50, 61 47, 64 44 Z"
        fill="currentColor"
      />
      <circle cx="88" cy="29" r="4" fill="#d65f45" />
    </svg>
  );
}

/** Curved flight line ending in the coral eye-dot. Scales to its container. */
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
