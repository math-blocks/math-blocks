---
'@math-blocks/react': patch
---

`MathRenderer` is now readable by screen readers. Its SVG has `role="img"` and an `aria-label` with a spoken description of the math, such as "x squared plus 1", and the drawn glyphs are hidden from assistive technology. Pass `aria-label` to use your own wording, or `aria-hidden` to hide the math when the page provides its own accessible alternative. The new `getSpokenText` export returns the generated description for an editor row.
