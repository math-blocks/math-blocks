---
'@math-blocks/typesetter': patch
---

Draw characters the font can't draw, for example because their glyph group isn't loaded, as a placeholder instead of throwing. `Context` gets an optional `onMissingGlyph` callback that's told about each one, and `Glyph` layout nodes get an optional `placeholder` field.
