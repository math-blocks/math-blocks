---
'@math-blocks/fonts': patch
---

New package: the math font subsets in OpenType (`.otf`) and WOFF (`.woff`) formats, for every font math-blocks supports, with their licences. It exports the list of fonts (`fonts`, `getFont`), the formats (`formats`), and `subsetPath` for finding a subset file in the package, so apps can serve the files and load them with `loadFontSubsets` from `@math-blocks/opentype`.
