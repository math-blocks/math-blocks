---
'@math-blocks/opentype': patch
---

Add `glyphGroups`, the groups of characters that the font subsets in `assets/subsets/` are split into, and fix `parse` failing on some valid fonts, such as fonts subset with fontTools:

- Read CFF charset format 1, which used to throw "Can't parse charset format 1 yet".
- Read the `MATH` table's glyph info (italic corrections and extended shapes) wherever its subtables are stored. `parse` used to assume they come before the `MathVariants` subtable, and read past the end of its data otherwise.
