# Notes

## Target Tests

`Course.targets` and `Unit.targets` accept topic slugs. Nothing reads them yet —
they exist so content can be tagged as it is added.

The custom test's "Got wrong" filter already pools missed questions across
every unit, which is the mechanism a Target Test would build on.

## Custom test

`/test` mixes units across grades. Length is a slider (1..scope; the top of
the track means all), with 10/20/50/All as quick taps. "Draw from" filters to
All, Not yet seen, or Got wrong. Selection and settings persist in
`koveline:v3:test-prefs`, filtered against live unit keys on load.

The scope picker is driven by `groupId`/`groupLabel` from the catalog, so any
future non-grade collection appears beside the grades automatically.

## Analytics

`@vercel/analytics` is mounted in `app/layout.tsx`. It only reports from a
Vercel deployment; nothing in dev.

## Settings

`lib/settings.ts` holds the store; state lives on `<html>` as `data-theme`,
`data-motion`, `data-perf` and a `--thaana-scale` variable, so CSS reacts with
no re-render. An inline script in `app/layout.tsx` applies saved settings
before first paint, which is what stops the theme flashing on load.

- **Themes** — Mahogany (default), Basalt, Lagoon, Paper. A theme is only a
  token swap; no component knows which is active. All four pass AA on text,
  muted text and the three semantic colours.
- **Performance mode** — drops the ambient layer, glass blur and every shadow
  in one switch. Intended for cheap Android hardware.
- **Motion** — Full / Reduced / Off. `prefers-reduced-motion` still wins
  regardless of the setting.
- **Dhivehi size** — scales Thaana only, via `--thaana-scale`. English is
  untouched.
- **Confirm before reset** — read live by the deck's reset control.

## Ambient layer

The cursor-following glow is gone. It read as a flashlight, did nothing on
touch, and cost a listener on every pointer move. Warmth now comes from
`.koveline-aurora`: two large blurred blobs on long offset loops, animating
only `transform` and `opacity`, so it stays on the compositor. Per-theme hues
come from `--ambient-rgb`.

JavaScript now only does what needs it — scroll progress and the small
active-card tilt — and both stand down under reduced motion or performance
mode.
