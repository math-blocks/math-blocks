---
'@math-blocks/tex': minor
'@math-blocks/editor': minor
---

Parse ASCII `-` as subtraction and negation instead of dropping it.

- `@math-blocks/tex`: `parse` now emits the minus sign `−` (U+2212) for `-`, matching what the editor uses everywhere else. Callers that looked for a `-` char in the returned tree will now see `−`.
- `@math-blocks/editor`: `parse` lexes both `-` and `−` as minus, and lexes `×` and `⋅` as multiplication. It now throws `Unexpected character '…'` on a char it doesn't recognize instead of silently dropping it, so input such as `a?b` or `1/2` that used to parse to a wrong tree now throws. Whitespace between tokens is still ignored.
