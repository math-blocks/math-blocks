# @math-blocks/semantic

## 0.2.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/semantic/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 274cb55: Fix the published types referencing `OneOrMore` and `TwoOrMore` without declaring them. Projects with `skipLibCheck: false` got "Cannot find name" errors, and with `skipLibCheck: true` those types became `any`, so `args` on sums, products, equations and other n-ary nodes went unchecked. The types now import them from `@math-blocks/core`.
- 47f0afb: Lint fixes from oxlint's type-aware rules in `serializer`, `util.normalize`, `util.traverse` and `util.traverseNumeric`: removed unneeded template literals, joined an array explicitly, and typed `Object.entries` values as `unknown`. No change in behavior.
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
  - @math-blocks/core@0.1.0

## 0.1.2

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- 5422428: Add `util.isSimplifiedNumber`, which returns true if a node is a number written in simplest form: an integer, a decimal without trailing zeros, or a fraction of integers in lowest terms, optionally negated. For example `2`, `-2.5` and `\frac{5}{2}` are simplified, while `5 \cdot \frac{1}{2}`, `\frac{4}{2}` and `2.0` aren't. Roots and constants such as `\pi` aren't handled yet.
- c9c0185: Export `serializer`, a jest snapshot serializer that prints semantic nodes as s-expressions. It replaces the `serializer` from the deprecated `@math-blocks/testing` package, so switching is a change of import path: `import { serializer } from '@math-blocks/semantic'`. Unlike the old one, its `test` only matches objects whose `type` is the type of a semantic node, so it no longer claims `null`, primitives or other packages' nodes.
- Updated dependencies [7d29fdc]
  - @math-blocks/core@0.0.13

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
