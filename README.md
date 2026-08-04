# Koveline

Study resources from the Maldives — starting with Grade 9 Islam.
Flip through real exam-prep questions, mark yourself honestly, and review
what you missed.

Next.js 16 (App Router, React 19) · fully static · installable PWA.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # runs the content validator first (prebuild)
npm start
```

`npm run validate` checks everything under `content/` — broken lesson
references, duplicate ids, malformed answers — and fails the build if
anything is wrong.

## Project structure

```
content/                     All study material lives here, not in code
  islam/
    subject.json
    grade-9/
      course.json            Title, credit, language
      unit-1/ … unit-6/
        unit.json            Lessons (real ids), titles, icon
        flashcards.json      Cards: { id, lessonId, front, back }
    grade-10/course.json     Draft — waiting on content
lib/content/
  schema.ts                  Zod schemas: subject/course/unit + flashcards,
                             mcq, paper, notes (the last three are ready
                             for future content)
  loader.ts                  Server-side reader; pages can only render
                             validated data
scripts/
  validate-content.ts        The prebuild gate
  migrate-v1.mjs             Historical: converted the v2 data/ shape
components/
  deck/engine.tsx            One engine for every deck (units + mixed)
  deck/ui.tsx                Study-sheet chrome, navigator, completion
  deck/rich-body.tsx         Total renderer for structured answers
  koel.tsx                   The bird and its flight line
app/
  [subject]/[course]/[unit]/[resource]/   One route for every deck
  [subject]/[course]/mixed/               All questions in one deck
```

## Adding content

**A new unit:** create `content/islam/grade-9/unit-7/` with a `unit.json`
and a `flashcards.json` following any existing unit. Give every lesson an
id (`l1`, `l2`, …) and point each card's `lessonId` at one. Run
`npm run validate` — it will tell you about anything you got wrong.

**A new course or subject:** copy the folder pattern
(`subject.json` → `course.json` → units). Set `"draft": true` on a course
to keep it out of the site until it's ready.

## Content attribution

All Grade 9 Islam questions come from the Iskandhar School Islam
Department's Q&A preparation papers. They were not written by the site's
creator.

## Progress

Progress is saved in the browser (`localStorage`), namespaced
`koveline:v3:*`. Old v2 progress is migrated automatically the first time
a returning visitor opens any deck.
