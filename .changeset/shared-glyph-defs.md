---
'@math-blocks/react': patch
---

Add `GlyphDefsProvider`. Every `MathRenderer` and `MathEditor` inside it shares one hidden `<svg>` of glyph definitions, so a page with lots of math stores each glyph's outline once instead of once per SVG. Without a provider, and when rendering on the server, SVGs keep their own `<defs>` as before. Also add `getStandaloneSvg`, which copies a rendered SVG with the definitions it uses inlined, for copying, downloading or drawing it as an image.
