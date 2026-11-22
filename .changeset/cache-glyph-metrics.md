---
'@math-blocks/opentype': patch
---

Cache glyph metrics in fonts returned by `parse`. `font.getGlyphMetrics()` now works out a glyph's metrics once and returns the same object on later calls, instead of scanning the glyph's outline every time. Typesetting makes hundreds of these calls per render.
