---
'@math-blocks/opentype': patch
---

Fix `loadFontSubsets` crashing browser builds. It imported `Blob` from Node's `buffer` module, so bundlers included a polyfill that fails as the page loads ("global is not defined"). It now uses the global `Blob`.
