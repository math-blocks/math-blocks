---
'@math-blocks/semantic': patch
---

Lint fixes from oxlint's type-aware rules in `serializer`, `util.normalize`, `util.traverse` and `util.traverseNumeric`: removed unneeded template literals, joined an array explicitly, and typed `Object.entries` values as `unknown`. No change in behavior.
