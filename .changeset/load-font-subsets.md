---
'@math-blocks/opentype': patch
---

Add `loadFontSubsets`, which loads the font subsets for a list of glyph groups (always including "base") and combines them into a `CombinedFont`, and `fromBaseUrl`, which loads them from a folder of subset files. Also add `GlyphNotFoundError`, which `getGlyphID` now throws for a character the font can't draw; `GlyphGroupNotLoadedError` is a kind of `GlyphNotFoundError`. The error message is unchanged.
