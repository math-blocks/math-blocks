---
'@math-blocks/opentype': patch
---

Add `GlyphNotFoundError`, which `getGlyphID` now throws for a character the font can't draw. The message is unchanged. `GlyphGroupNotLoadedError` is now a kind of `GlyphNotFoundError`, so one check handles both.
