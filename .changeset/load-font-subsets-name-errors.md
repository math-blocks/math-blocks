---
'@math-blocks/opentype': patch
---

When a subset fails to load or parse, `loadFontSubsets` now rejects with an error that names it, such as `Couldn't parse the "calculus" font subset: No Unicode cmap subtable. …` or `Couldn't load the "calculus" font subset: Failed to fetch`. The original error is the new error's `cause`.

`fromBaseUrl`'s error for a failed response is now `Couldn't fetch <url>: <status> <statusText>`, since `loadFontSubsets` adds the subset's name.
