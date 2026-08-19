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

Two independent trackers, both mounted in `app/layout.tsx`:

- **Vercel Analytics** (`@vercel/analytics`) — only reports from a Vercel
  deployment; nothing in dev.
- **Umami** — loaded via `next/script` with `strategy="afterInteractive"`,
  which matches the `defer` in Umami's own snippet and keeps it off the
  critical path. The site id lives in the tag.

The service worker ignores cross-origin requests, so neither script is
cached or intercepted. Ad blockers will stop both; that is expected and
means real numbers will read lower than raw traffic.

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

## Textbooks

Two curriculum books at `/textbooks`, served from `public/textbooks/`.

**Do not re-compress them with Ghostscript.** It reduces 28 MB → 7.8 MB but
silently corrupts the Thaana: re-encoding drops glyphs from MVAWaheed-Bold,
QCF2BSML (Qur'anic) and TraditionalArabic. A rendered comparison of page 30
shows garbled character codes and missing lines. This was tested, not assumed.

What is safe is `qpdf --linearize --object-streams=generate --recompress-flate`,
which is lossless: 28 MB → 23 MB, verified with `qpdf --check`.

Linearisation is the point, not the size. A linearised PDF streams via HTTP
range requests, so the browser's viewer shows page 1 almost immediately and
fetches the rest as the reader scrolls. Vercel serves range requests on static
files, so no server work is needed.

Three further guards against lag:

- The `<iframe>` mounts only when the reader presses "Read here", so visiting
  `/textbooks` downloads no PDF at all.
- The service worker skips `/textbooks/` entirely (`sw.js`), so a 23 MB file
  is never pulled into the cache and partial loading is never defeated.
- Below 820 px the embed is replaced by a direct link, handing off to the
  phone's native PDF viewer — faster and far more usable than an iframe,
  especially on iOS.

## Deck: mode switching no longer loses your place

Reported: answering a batch then using the wrong-answer controls dropped the
reader back at question 1. The marks survived (the progress bar kept its
colour) — only the position was lost.

Cause: `changeMode` called `resetView()` unconditionally, so every mode
button set `idx` to 0, including pressing the mode already active. In random
mode it also rebuilt the deck, which reshuffled it, so the old position was
unrecoverable even in principle.

Fix, in `components/deck/engine.tsx`:

- pressing the active mode is a no-op;
- `savedPos` (a ref) records `{orderIds, idx}` per mode on every switch, and
  restores both when returning, so the shuffle is preserved too;
- a restored order is only reused when it still covers exactly the current
  deck, so cards newly marked wrong are never hidden from a review round.

Changing lesson still resets to question 1, which is intended.

## Navigation, sign-in and the phone: one menu, fewer words

The bar carried four controls and two routes to the same screen: an "Explore"
menu, a "Start studying" button pointing at `/#subjects`, and — inside the
menu — a "Question banks" row pointing there as well. It now carries three:
the wordmark home, one **Study** menu, the account control and settings.

The Study menu lost its subject card wrapper ("Islam" / "Current subject" as a
heading over the grade tiles). With one subject, the section label *is* the
subject, and the two grade tiles sit directly under it. Custom test and
Textbooks moved under a "More" label. The account menu is three plain rows;
the second line under each ("Progress saved to your account.", "This device
keeps its own progress.") was explanation nobody needed twice.

Sign-in and sign-up are one form behind two tabs instead of a form plus a
"No account yet? Create one" sentence, and every string on that screen —
along with the account page and the menu — now comes from `site-copy.json`,
under `navigation`, `auth` and `account`.

Signing in no longer lands on `/account`. It goes back to whatever page you
came from, or to the home page, which is the one with the continue card.
Signing out goes home too, not to the sign-in screen: signing out is not a
reason to stop studying.

Phones: the three bar controls are 40px targets rather than ~30px, inputs are
16px so iOS stops zooming the page on focus, and the account menu drops to the
full-width sheet the Study menu already used.

The real find was that every `env(safe-area-inset-*)` rule in this file — the
bottom sheets, the mobile action bar, the question navigator — was resolving
to zero, because the viewport never opted in. `viewportFit: "cover"` in
`app/layout.tsx` turns them on, and the navbar now pads itself by the top
inset so the installed app's translucent status bar has a background under it.
**Worth a look on a real iPhone, installed and in landscape** — it is the one
change here that cannot be checked in a desktop browser.
