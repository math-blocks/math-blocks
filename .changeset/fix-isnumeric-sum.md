---
'@math-blocks/semantic': patch
---

Fix `util.isNumeric` returning `false` for `Sum` nodes. `NodeType.Summation` was `'Summation'`, but `Sum` nodes have type `'Sum'`. `NodeType.Summation` is now `'Sum'`.
