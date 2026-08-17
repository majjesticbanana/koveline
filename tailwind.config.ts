import type { Config } from "tailwindcss";

/**
 * Koveline colour utilities are semantic aliases backed by CSS variables.
 * This is deliberate: changing theme must also change Tailwind-authored
 * component colours. Hard-coded palette values here caused the old themes to
 * clash on study/quiz pages even though globals.css changed the page tokens.
 */
const c = (token: string) => `rgb(var(--${token}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: c("text"),
        cream: c("bg"),
        deep: c("deep"),
        surface: c("surface"),
        raised: c("raised"),
        hover: c("hover"),
        latte: c("raised"),
        line: c("line"),
        "line-strong": c("line-strong"),
        coffee: c("text-2"),
        "coffee-deep": c("text"),
        cocoa: c("muted"),
        caramel: c("accent-bright"),
        teal: c("accent"),
        "teal-deep": c("accent-bright"),
        "teal-soft": c("accent-soft"),
        coral: c("accent"),
        "coral-deep": c("accent-strong"),
        "accent-ink": c("accent-ink"),
        green: c("positive"),
        "green-bg": c("positive-bg"),
        "green-line": c("positive-line"),
        red: c("negative"),
        "red-bg": c("negative-bg"),
        "red-line": c("negative-line"),
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
