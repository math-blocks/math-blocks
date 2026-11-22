---
'@math-blocks/react': patch
---

Draw placeholders for characters the font can't draw, and add an `onMissingGlyph` prop to `MathRenderer` and `MathEditor`. Rendering either without a font in `FontDataContext` now fails with a message that says so.
