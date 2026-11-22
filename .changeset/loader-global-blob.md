---
'@math-blocks/opentype': patch
---

Fix `loadFontSubsets` in browsers and in jsdom. It imported `Blob` from Node's `buffer` module, so bundlers included a polyfill that fails as the page loads ("global is not defined"). It now parses the subsets' ArrayBuffers directly, without a Blob.

`parse` now also accepts an ArrayBuffer, and the type of what it reads is exported as `ByteSource`. Blobs work as before.
