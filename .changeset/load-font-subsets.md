---
'@math-blocks/opentype': patch
---

Add `loadFontSubsets`, which loads the font subsets for a list of glyph groups (always including "base") and combines them into a `CombinedFont`, and `fromBaseUrl`, which returns a loader that fetches subsets from a folder of subset files.
