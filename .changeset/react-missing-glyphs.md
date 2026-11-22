---
'@math-blocks/react': patch
---

Draw placeholders for characters the font can't draw, and add an `onMissingGlyph` prop to `MathRenderer` and `MathEditor`. It's called after rendering, once for each missing character, and again only when the set of missing characters changes, so it can safely set state. Rendering either component without a font in `FontDataContext` now fails with a message that says so.
