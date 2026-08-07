import type { Config } from "tailwindcss";

/**
 * Koveline — Mahogany × Rust canonical dark system.
 * Darkness is warm coffee/mahogany, never neutral black.
 * Ember = interaction/focus · sage = correct · brick = wrong/review.
 * Glass is reserved for controls and floating utility surfaces.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f7e8df",
        cream: "#190c09",
        deep: "#110705",
        surface: "#29150f",
        raised: "#331b14",
        hover: "#43271d",
        latte: "#331b14",
        line: "#4a2921",
        "line-strong": "#66382d",
        coffee: "#dcc7bc",
        "coffee-deep": "#f7e8df",
        cocoa: "#b19489",
        caramel: "#e48662",
        teal: "#c66340",
        "teal-deep": "#e48662",
        "teal-soft": "#3d2219",
        coral: "#c66340",
        "coral-deep": "#a94f33",
        "accent-ink": "#1a0b07",
        green: "#9bc1a0",
        "green-bg": "#1d251d",
        "green-line": "#49634e",
        red: "#dc7a70",
        "red-bg": "#2b1716",
        "red-line": "#70403b",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        thaana: ["var(--font-thaana)", "var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        faint: "0 1px 2px rgba(0,0,0,.16)",
        glass: "0 14px 42px rgba(0,0,0,.22)",
      },
      borderRadius: {
        ctl: "10px",
        card: "14px",
        panel: "16px",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(7px)" },
          to: { opacity: "1", transform: "none" },
        },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        "question-in": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        rise: "rise .22s cubic-bezier(.22,.8,.25,1)",
        fade: "fade .18s ease",
        "question-in": "question-in .2s cubic-bezier(.22,.8,.25,1)",
      },
    },
  },
  plugins: [],
};
export default config;
