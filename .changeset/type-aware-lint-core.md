---
'@math-blocks/core': patch
---

Lint fixes from oxlint's type-aware rules: `UnreachableCaseError` converts the value with `String()` for its message, so a symbol no longer makes the constructor throw a `TypeError`; the message for every other value is unchanged. `clone` asserts its `JSON.parse` result, which changes no behavior.
