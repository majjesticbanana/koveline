# Koveline — canonical visual direction

## Theme

**Mahogany × Rust + restrained glass** is the approved direction.

Core tokens:

- background `#190c09`
- upper/deeper background `#21110d`
- deepest tone `#110705`
- surface `#29150f`
- secondary surface `#331b14`
- raised surface `#3d2219`
- hover surface `#43271d`
- primary text `#f7e8df`
- secondary text `#dcc7bc`
- muted text `#b19489`
- border `#4a2921`
- strong border `#66382d`
- ember interaction `#c66340`
- brighter ember `#e48662`

The background must read as reddish coffee / mahogany, not neutral black.
Avoid large bright-orange blocks or black-on-orange branding.

## Material rule

**Solid information, glass interaction.**

Restrained glass is used on nav/utility/floating controls. Reading surfaces,
questions, answers, unit content, and provenance remain stable and mostly solid.
The glass treatment is intentionally subtle: roughly 66% surface opacity,
18px blur, low specular highlight, warm translucent edge.

## Semantic states

Brand ember is never overloaded as correctness feedback.

- correct: muted sage `#729d79` / light sage `#9bc1a0`
- wrong / review: brick `#b65752` / light brick `#dc7a70`

Correct and wrong states tint the study sheet lightly and add a thin semantic
edge. They must not recolour the whole page or feel game-like.

## Motion

The page should feel alive while interacting and calm when idle.

- extremely faint pointer-following warmth
- maximum ~0.35° pointer tilt on selected cards/sheet
- 2px scroll progress signature
- short directional question transition
- answer unfolds in ~220ms
- glass controls carry a restrained moving specular highlight
- no cursor blobs, magnetic buttons, bouncing, confetti, scroll-jacking, or
  exaggerated parallax
- `prefers-reduced-motion` disables nonessential movement

## Brand identity

- Bricolage Grotesque for English display/UI
- Faruma for Dhivehi
- featureless abstract Koveli mark; no eye/facial details
- English site shell; Dhivehi prominent within Islam content
- the flight line uses ember → brighter ember
- numerical unit identity; no mosque/crescent/emoji visual shorthand
