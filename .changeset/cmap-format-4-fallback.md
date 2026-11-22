---
'@math-blocks/opentype': patch
---

`parse` now reads fonts that only have a BMP-only cmap subtable (platform 3, encoding 1, format 4). It still prefers the platform 3, encoding 10 (format 12) subtable when a font has one, and falls back to format 4 otherwise. Before, fonts without a format 12 subtable failed with "Missing encoding record for platformID = 3, encodingID = 10".
