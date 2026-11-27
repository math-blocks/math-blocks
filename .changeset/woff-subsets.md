---
'@math-blocks/opentype': minor
---

Read WOFF 1.0 fonts. `parse` (and so `loadFontSubsets`) now accepts a `.woff` file as well as a raw OpenType `.otf` file, decompressing its tables with `DecompressionStream`.

Breaking: `fromBaseUrl` now fetches `${baseUrl}/${group}.woff` by default instead of `.otf`. Pass the new `{format: 'otf'}` option to keep fetching `.otf` files. The new `FontFormat` and `FromBaseUrlOptions` types are exported.
