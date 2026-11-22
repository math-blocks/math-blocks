---
'@math-blocks/opentype': patch
---

Add `combineFonts`, which combines the font subsets that have been loaded so far into one `Font` (a `CombinedFont`). More subsets can be added later with `withGroup`, and glyph IDs stay the same as groups are added. `getGlyphID` throws a `GlyphGroupNotLoadedError`, naming the group to load, for a character whose subset isn't loaded yet. Also add `getGlyphGroup`, which returns the group a code point belongs to, and `glyphGroupsForText`, which lists the groups needed to render a string.
