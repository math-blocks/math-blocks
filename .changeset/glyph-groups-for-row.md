---
'@math-blocks/typesetter': patch
---

Add `glyphGroupsForRow`, which returns the glyph groups needed to typeset an editor tree, including characters the typesetter draws that aren't in the tree as characters, such as accents, the radical sign and math-italic letters.
