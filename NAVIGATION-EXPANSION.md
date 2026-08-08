# Navigation expansion

The navbar now uses one compact **Explore** dropdown so Koveline can grow without adding a row of top-level links.

## Current structure

- Subjects
  - Islam
    - Grade 9
    - Grade 10
  - More subjects (future slot)
- Resources
  - Past Papers
  - Question banks

## Adding a subject later

Add its content/routes first, then add the subject/course entries in `components/navbar.tsx`. The dropdown is intentionally structured as cards rather than a generic select, and the mobile version becomes a viewport-bounded panel.

## Past Papers

`/past-papers` now exists as a truthful empty hub. It does not invent or claim any papers. As real papers are added, organise them by subject → grade → year/paper and replace the two empty grade cards with real collections.

## Related cleanup

- Removed the stale “Islamic History is being prepared” homepage note.
- Updated metadata from 613 to 722 total Islam questions (389 Grade 9 + 333 Grade 10).
- Bumped the service-worker cache and added Grade 10 + Past Papers to the core routes.
