import type { Config } from "tailwindcss";

/**
 * Koveline v3.2 — "Basalt & Brass".
 *
 * Dark chrome, paper reading surfaces. Light-on-dark optically thins Thaana
 * fili, so every surface that carries Dhivehi study text stays cream; the
 * basalt does navigation, hero, panels and footer.
 *
 * One colour, one job:
 *   brass = interactive (buttons, links, active states)
 *   sage  = quiet second (structure, secondary marks)
 *   teal  = correct / progress
 *   red   = wrong / needs review, nothing else
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dark chrome
        basalt: "#161412",
        "basalt-2": "#232019",
        "basalt-3": "#312c22",
        "basalt-line": "#413a2e",
        // paper
        surface: "#f6f1e6",
        cream: "#efe9db",
        latte: "#e3ddcd",
        line: "#cfc6b0",
        // text
        ink: "#1c1a16",
        cocoa: "#6b6152",
        "on-dark": "#efe8db",
        "on-dark-dim": "#b3a894",
        // accents
        brass: "#c9973f",
        "brass-deep": "#a67a2b",
        "brass-soft": "#f4e6c8",
        sage: "#5f7a55",
        "sage-deep": "#42563b",
        "sage-soft": "#e6ece2",
        coffee: "#5d3f26",
        "coffee-deep": "#3d2814",
        caramel: "#b97f4a",
        // marks
        teal: "#0f7a72",
        "teal-deep": "#0a5a54",
        "teal-soft": "#dcebe7",
        green: "#3f7a3a",
        "green-bg": "#e6efd8",
        "green-line": "#bcd6a2",
        red: "#a8503a",
        "red-bg": "#f5e2da",
        "red-line": "#e0bcaa",
        coral: "#c96a4a",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        thaana: ["var(--font-thaana)", "var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        warm: "0 16px 40px -22px rgba(0,0,0,.55)",
        "warm-sm": "0 5px 16px -9px rgba(0,0,0,.5)",
        lift: "0 18px 44px -26px rgba(0,0,0,.7)",
      },
      borderRadius: { card: "16px", sheet: "24px" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: { rise: "rise .28s ease", fade: "fade .28s ease" },
    },
  },
  plugins: [],
};
export default config;
