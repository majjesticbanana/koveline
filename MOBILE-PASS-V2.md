# Mobile study UI refinement v2

This pass responds to the mobile flashcard screenshot and focuses on the actual study loop.

## Fixed
- Current-question marker is a crisp ivory line with no glow.
- Lesson navigator is smaller and visually secondary.
- The `Question n / total` chip is the Jump to Question trigger and now includes a small grid cue.
- Jump to Question is portalled to `document.body`, viewport-bounded with safe-area insets, and cannot inherit a transformed/too-wide study parent.
- The Jump to Question panel uses a stable five-column grid on phones and automatically scrolls the current question into view.
- Current question uses an ivory outline; correct/wrong retain semantic sage/brick states.

## Mobile composition
- Course heading and metadata are tighter.
- Stats and progress are denser.
- In order / Random is a compact segmented control instead of a full-width slab.
- Review wrong / Reset are quiet utilities rather than more large boxes.
- Question card padding and Thaana size are tuned for ~390px screens.
- Reveal action is no longer a large orange rectangle inside a dark rectangular bar: the mobile action area fades into the page and the button is a restrained glass/ember capsule.
- Mobile glass remains blur-free for performance.
