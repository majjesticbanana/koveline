# Mobile study pass

This build focuses on the flashcard study experience at phone widths.

## Question picker
- `BottomSheet` now renders through `createPortal(..., document.body)` so fixed positioning is never trapped by transformed ancestors.
- Phone layout is a true bottom sheet with an independently scrolling body.
- Question navigator uses a stable 5-column phone grid and 8-column desktop grid.
- Current question uses an ivory outline/tint; right/wrong retain semantic sage/brick.
- Picker subtitle shows current position plus right/wrong counts instead of an ambiguous “answered” total.

## Phone composition
- 56px navbar, smaller logo/CTA, 14px page gutters.
- Course title block is substantially shorter.
- Lesson navigator compresses to a 58px control with 40px previous/next targets.
- Question/stat chips remain on one row.
- Question-order segmented control receives a dedicated full-width row.
- Review/reset occupy a second compact utility row.
- Study sheet uses tighter padding and type sized for a 390px viewport.
- Bottom action area uses a near-solid surface and 48px minimum action targets.
- Picker/lesson options are resized for touch without looking like desktop controls squeezed smaller.

## Performance on phones
- Backdrop blur is disabled for glass panels below 640px.
- Pointer tilt / radial hover work is disabled in the phone layout.
- Mobile background drops the noise texture and secondary radial layer.
- The sticky action bar is nearly opaque rather than a continuously blurred surface.
