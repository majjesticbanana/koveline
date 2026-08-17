# Theme overhaul

This pass replaces the old Basalt / Lagoon / Paper theme set and fixes the main reason alternate themes clashed on study pages.

## Root cause fixed

`globals.css` switched CSS variables per theme, but `tailwind.config.ts` still compiled component utilities such as `text-cocoa`, `bg-red-bg`, `bg-green-bg`, `bg-teal`, `text-ink`, and `border-line` to fixed Mahogany hex colours. That meant many quiz controls did not actually change with the selected theme.

Those Tailwind aliases now resolve through theme RGB custom properties, including opacity modifiers. Study states, navigation, controls, question jump, lesson picker, reveal/mark buttons, and muted text now follow the selected palette.

## New curated themes

- Mahogany — warm espresso / ivory / rust (default)
- Graphite — cool charcoal / steel blue
- Moss — deep olive / muted bronze
- Mulberry — dark plum / dusty rose
- Ivory — warm light / walnut

Old saved theme ids migrate automatically:

- Basalt -> Graphite
- Lagoon -> Moss
- Paper -> Ivory

## Theme selector

The old three-stripe swatches were replaced with mini study-surface previews. Each preview shows background, card, text hierarchy, accent, correct and wrong colours, so users can judge readability before choosing.

## Contrast

`scripts/audit-theme-contrast.py` checks the canonical text and quiz-state pairs for every selectable theme. All currently pass WCAG AA 4.5:1, including muted copy, accent buttons, correct/wrong surfaces, and filled mark buttons.

Run:

```bash
npm run audit:themes
```
