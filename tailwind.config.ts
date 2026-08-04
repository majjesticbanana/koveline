import type { Config } from "tailwindcss";

/**
 * Koveline v3 tokens.
 *
 * Hierarchy (agreed with the owner + Sol):
 *  - teal   = interactive. Links, primary buttons, progress fill, active states.
 *  - coral  = signature, not clickable. The koel's eye: flight-line ends,
 *             annotation underlines, completion moments, featured marks.
 *  - red    = one meaning only: marked wrong / needs review. Never on the
 *             home page, never decorative.
 *  - cocoa  = secondary text. Replaces v2 `muted` (#8a7461, 4.14:1 — failed
 *             AA); cocoa is ~6:1 on surface and ~5.3:1 on cream.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2a1f16",
        cream: "#f6efe2",
        surface: "#fdfaf3",
        latte: "#ecdfc8",
        line: "#dcc9ab",
        coffee: "#5d3f26",
        "coffee-deep": "#432c17",
        cocoa: "#6f5443",
        caramel: "#b97f4a",
        teal: "#12716b",
        "teal-deep": "#0c5550",
        "teal-soft": "#dcebe7",
        coral: "#d65f45",
        "coral-deep": "#b14a38",
        "coral-soft": "#f7e3dc",
        green: "#3f7a3a",
        "green-bg": "#e8f0dc",
        "green-line": "#c4dcae",
        red: "#b14a38",
        "red-bg": "#f5e1da",
        "red-line": "#e6c2b4",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        thaana: ["var(--font-thaana)", "var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        warm: "0 16px 40px -22px rgba(42,31,22,.38)",
        "warm-sm": "0 5px 16px -9px rgba(42,31,22,.35)",
      },
      borderRadius: {
        card: "18px",
        sheet: "26px",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        rise: "rise .28s ease",
        fade: "fade .28s ease",
      },
    },
  },
  plugins: [],
};
export default config;
