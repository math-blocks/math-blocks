---
'@math-blocks/editor': patch
---

The string helpers in `util` (`row`, `frac`, `sqrt`, `root`, `sup`, `sub` and `subsup`) make one char per code point instead of per UTF-16 code unit, so a character outside the BMP, such as `𝑥` (U+1D465), becomes a single char rather than two broken surrogate chars.
