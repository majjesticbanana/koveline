# Question of the Day + Custom Test

## Homepage
- Added a Question of the Day block below the hero.
- One question is chosen deterministically from the full live question bank per Maldives calendar day (UTC+5).
- The answer stays hidden until the user chooses Reveal answer.
- Source context shows grade, unit, lesson and a link back to the full unit.
- Homepage is dynamic so the daily question changes without requiring a rebuild.

## Custom test
- Added `/test` and linked it quietly from Explore > Resources.
- Users can combine Grade 9 and Grade 10, then choose individual units inside either grade.
- Test size: 10, 20, 50, or all selected questions.
- Order: Random or In order.
- Random limited-size tests sample across the whole selected scope.
- Custom-test progress does not replace the homepage's normal Continue card.
- Existing deck UI is reused for reveal, self-marking, question navigation, wrong review, and mobile controls.

## Deck engine extension
- Optional initial mode for custom decks.
- Optional fresh-start behavior for ephemeral tests.
- Optional suppression of Last Studied updates.
- Mixed/custom unit context can include grade as well as unit.
