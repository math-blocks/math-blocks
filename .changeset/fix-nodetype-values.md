---
'@math-blocks/semantic': patch
---

Fix the values of `NodeType.PlusMinus`, `NodeType.MinusPlus`, `NodeType.Vector` and `NodeType.Matrix`. They were lowercase (`'plusminus'`, `'minusplus'`, `'vector'`, `'matrix'`) and didn't match the `type` of the nodes the builders create, so comparing a node's type against them never matched.
