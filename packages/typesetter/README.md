# @math-blocks/typesetter

This package provides functions for generating renderer-agnostic scene graphs
from `Editor.Node`s.  The scene graphs can be rendered using components from
@math-blocks/react.  They include the cursor or selection highlight when present.

## Functions

- `typeset`: returns a scene graph for single-line math.
- `typesetWithWork`: returns a scene graph for multi-line math.

## TODO
- Switch to a different font, maybe [STIX](https://www.stixfonts.org/)
- Limits, summations, integrals
- Units of measure
- Trigonmetric functions

## References

- [MATH - The mathematical typesetting table](https://docs.microsoft.com/en-us/typography/opentype/spec/math)
- [Appendix G illuminiated](https://www.tug.org/TUGboat/tb27-1/tb86jackowski.pdf)
- [OpenType Math Illuminated](https://www.tug.org/~vieth/papers/bachotex2009/ot-math-paper.pdf)
- [OpenType font features guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/OpenType_fonts_guide)
