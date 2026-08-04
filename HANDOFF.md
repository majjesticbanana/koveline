# Koveline v3 — what changed and what's yours to do

## Done in this drop

**Design**
- New koel brand mark (soaring silhouette, coral eye) — navbar, favicon,
  PWA icons, apple icon, OG share card, 404, deck completion
- Signature "flight line" (teal curve → coral dot) under the hero and on
  the completion card
- Retuned tokens: cocoa secondary text (passes AA; old muted failed),
  teal = interactive, coral = signature only, red = wrong/review only
- Compact question-led hero ("How much do you really know?"), old
  gradient/glow/sparks hero removed
- Home: single substantial Islam panel, weighted unit cards (unit 3 and
  any 80+-question unit span wide), teal-only progress ("18 of 55
  reviewed"), no red anywhere on the home page
- Provenance panel (dashed stamp border) + "Made to be useful" note +
  "Made freely in the Maldives" footer
- Study sheet: QUESTION 08/55 header, dashed lesson stamp (Thaana),
  coral annotation sweep on reveal, koel completion moment (confetti gone)

**Structure**
- One deck engine for everything; old quiz + definitions containers gone
- New routes: /islam/grade-9/unit-N/flashcards and /islam/grade-9/mixed
  (all 389 questions, unit badge on each card)
- 301 redirects from every old URL
- Home no longer ships the question bank: 939→630 KB raw, 239→188 KB gzip,
  zero card bodies in home chunks (verified against the build output)

**Fixes**
- Bottom sheet: only mounted while open, focus trap, focus restore
  (was a keyboard trap with 130 hidden tab stops)
- lang="dv" on every Thaana element; screen readers now voice Dhivehi
- Empty-deck guard for ALL empty decks, not just review mode
- v2→v3 progress migration, one-time, deletes old + definitions keys
- Saved random order rebuilt if the unit gains cards (stale-order trap)
- background-attachment:fixed replaced with a fixed pseudo-element
- Duplicate @keyframes removed; error page added; sitemap + robots + OG

## Yours to do

1. `npm install && npm run dev` — click through, then screenshot the home
   page and a deck for Sol. My sandbox has no browser; visual QA is the
   one thing I couldn't run.
2. Check Faruma rendering on a real Android phone (the thing I can't see).
3. If your domain isn't https://www.koveline.com, change `metadataBase`
   in app/layout.tsx and BASE in app/sitemap.ts.
4. Deploy. On deploy, returning visitors' progress migrates automatically.
5. Grade 10: send me the material in any form; the folder is scaffolded
   at content/islam/grade-10 as draft.

## Known deliberate choices (so Sol doesn't flag them as accidents)

- Google Fonts still loads via <link>: next/font/google can't fetch in my
  sandbox at build time. Swapping later is a 10-line change.
- Course page redirects home: with one course, home IS the course index.
- Subject panel has no emoji/icon: mosque/crescent both read as cliché per
  the brief; the bilingual title carries the identity.
- Mixed deck has no unit filter: units already have their own decks.
