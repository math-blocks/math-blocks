---
'@math-blocks/fonts': patch
---

New package: the math font subsets as WOFF (`.woff`) files, for every font math-blocks supports, with their licences. It exports the list of fonts (`fonts`, `getFont`), the folder names (`FONT_FOLDERS`, `isFontFolder`, and the `FontFolder` union type), and `subsetPath` for finding a subset file in the package, so apps can serve the files and load them with `loadFontSubsets` from `@math-blocks/opentype`.
