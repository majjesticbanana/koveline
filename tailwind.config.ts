import type { Config } from "tailwindcss";

/**
 * Koveline v4 — cream canonical, per Sol's polish pass + owner rulings.
 * Separation comes from warm 1px borders, not shadows. Radii stay modest
 * (panels 14-16, controls 10) so soft never drifts into blobby.
 * Roles: teal = interactive · green/red = marks · coral = punctuation only.
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
        "line-strong": "#c3ab83",
        coffee: "#5d3f26",
        "coffee-deep": "#432c17",
        cocoa: "#6f5443",
        caramel: "#b97f4a",
        teal: "#12716b",
        "teal-deep": "#0c5550",
        "teal-soft": "#dcebe7",
        coral: "#d65f45",
        "coral-deep": "#b14a38",
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
        faint: "0 1px 2px rgba(42,31,22,.06)",
      },
      borderRadius: {
        ctl: "10px",
        card: "14px",
        panel: "16px",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        rise: "rise .18s ease",
        fade: "fade .18s ease",
      },
    },
  },
  plugins: [],
};
export default config;
