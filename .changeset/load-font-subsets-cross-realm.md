---
'@math-blocks/opentype': patch
---

Fix `loadFontSubsets` throwing "data.arrayBuffer is not a function" when a loader returns an `ArrayBuffer` created in another realm, such as an iframe or a worker.
