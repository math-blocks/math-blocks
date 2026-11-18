# @math-blocks/semantic

## 0.1.1

### Patch Changes

- 548281d: Fix `util.isNumeric` returning `false` for `Sum` nodes. `NodeType.Summation` was `'Summation'`, but `Sum` nodes have type `'Sum'`. `NodeType.Summation` is now `'Sum'`.
- 778d07d: Fix the values of `NodeType.PlusMinus`, `NodeType.MinusPlus`, `NodeType.Vector` and `NodeType.Matrix`. They were lowercase (`'plusminus'`, `'minusplus'`, `'vector'`, `'matrix'`) and didn't match the `type` of the nodes the builders create, so comparing a node's type against them never matched.
- 0a9084e: Fix `util.normalize` for `Derivative` nodes. It printed the degree as `[object Object]` and left out the variable, so derivatives with different degrees or variables normalized to the same string. It now prints `(Derivative <arg> :bvar <bvar> :degree <degree>)`.
- a5e4ccc: Fix `builders.numRel` so it keeps its `loc` argument. It used to accept `loc` but leave it off the node it returned.

## 0.1.0

### Minor Changes

- 7c4fdbe: Update builders.matrix and builders.table to take a flat array of children

### Patch Changes

- 0062515: Add optional 'style' property to all nodes
