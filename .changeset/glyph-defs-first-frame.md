---
'@math-blocks/react': patch
---

Fix `GlyphDefsProvider` painting one frame with no glyph definitions on first render. The provider's hidden `<svg>` now picks up the definitions that renderers add on mount before the browser paints, so math no longer flashes blank when a page loads.
