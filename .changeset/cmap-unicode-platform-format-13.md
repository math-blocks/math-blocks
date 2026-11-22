---
'@math-blocks/opentype': patch
---

`parse` reads more fonts' character maps. Besides the Windows (3, 10) and (3, 1) cmap subtables, it now reads the Unicode-platform (0, 4), (0, 6) and (0, 3) subtables, and cmap format 13 (many-to-one range mappings, used by last-resort fonts). It picks the first of (3, 10), (0, 4), (0, 6), (3, 1) and (0, 3) whose subtable is in format 4, 12 or 13. When none is readable, the error lists the records and formats it found.
