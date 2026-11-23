---
'@math-blocks/react': patch
---

`MathRenderer` and `MathEditor` render faster and produce smaller SVG markup. `SceneRenderer` now draws the scene with plain functions instead of one React component per node, so React creates one fiber per SVG element and none for wrappers. On a page of 100 expressions, rendering takes about 15% less script time and the markup is about 15% smaller.

The markup changes in three ways that don't affect what's drawn:

- Glyphs that aren't pending no longer get `style="opacity:1"`. Pending glyphs still get `opacity: 0.5`.
- Translations in `transform` attributes are rounded to a thousandth of a pixel, so values like `translate(68.01599999999999, 0)` become `translate(68.016,0)`. Glyph scales aren't rounded.
- `<line>` and `<rect>` elements no longer get a stray `type` attribute.
