# Notes

## Deyha & Daleels

Three courses exist as scaffolds under `content/islam/` — `deyha-9`,
`deyha-10`, `daleels` — grouped by `collection: "deyha-daleels"` and marked
`draft: true`. They render on the home page as "Soon" cards and become live
links as soon as units are added. No code change needed.

**The source PDFs cannot be extracted.** All three contain zero Thaana
characters in their text layer; the Dhivehi is drawn as image fragments
(5,762 images across 24 pages in the Grade 9 file). The Arabic does extract
but is corrupted — alifs and yaas collapse into duplicated diacritics, so
`الَّتِي` comes out as `الَّتِِ`.

Ask for the original Word documents (papers by Seema miss, ISK). They will
extract cleanly the way the Grade 9/10 Q&A papers did.

Card shape when the content arrives:

- **Daleel** — front: the claim. `context`: surah + ayah reference.
  back: Arabic text, then the Dhivehi meaning. Set `lang: "ar"` on the
  Arabic so it renders in its own script.
- **Deyha** — front: "the deyha of ayah N of Surah X". `context`: the ayah
  and its meaning. back: a `list` of the derived points.

## Target Tests

`Course.targets` and `Unit.targets` accept topic slugs. The three new courses
are pre-tagged (`deyha`, `daleel`, `grade-9`, `grade-10`). Nothing reads them
yet — they exist so content added now won't need re-tagging later.

The custom test's "Got wrong" filter already pools missed questions across
every unit, which is the mechanism a Target Test would build on.

## Custom test

`/test` mixes units across grades. Length is a slider (1..scope; the top of
the track means all), with 10/20/50/All as quick taps. "Draw from" filters to
All, Not yet seen, or Got wrong. Selection and settings persist in
`koveline:v3:test-prefs`, filtered against live unit keys on load.

The scope picker is driven by `groupId`/`groupLabel` from the catalog, so
Deyha & Daleels appears beside the grades once it has content.

## Analytics

`@vercel/analytics` is mounted in `app/layout.tsx`. It only reports from a
Vercel deployment; nothing in dev.
