---
'@math-blocks/opentype': patch
---

Lint fix from oxlint's type-aware rules: the `ByteSource` that `parse` wraps around an `ArrayBuffer` returns `Promise.resolve(buffer)` instead of using an `async` function. No change in behavior.
