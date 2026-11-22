---
'@math-blocks/react': patch
---

`MathRenderer` and `MathEditor` now store each distinct glyph outline once per SVG, in a `<defs>` block, and draw every occurrence of a glyph with `<use>`. Glyphs render in the same place as before, but the markup is smaller when a glyph repeats. Code that reads the rendered SVG and expects one `<path>` per glyph needs to follow each `<use>` to its definition.
