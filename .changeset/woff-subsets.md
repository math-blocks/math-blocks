---
'@math-blocks/opentype': patch
---

Read WOFF 1.0 fonts. `parse` (and so `loadFontSubsets`) now accepts a `.woff` file as well as a raw OpenType `.otf` file, decompressing its tables with `DecompressionStream`. `fromBaseUrl` takes a new `{format: 'woff'}` option to fetch `${baseUrl}/${group}.woff` instead of the default `.otf`, and the new `FontFormat` and `FromBaseUrlOptions` types are exported.
