# @math-blocks/editor

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/editor/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 47f0afb: Lint fixes from oxlint's type-aware rules in the `frac` and vertical-movement reducers (an optional chain and an explicit `default` case). No change in behavior.
- Updated dependencies [274cb55]
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/core@0.1.0
  - @math-blocks/semantic@0.2.0
  - @math-blocks/parser@0.1.0

## 0.0.15

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
- Updated dependencies [5422428]
- Updated dependencies [c9c0185]
  - @math-blocks/core@0.0.13
  - @math-blocks/parser@0.0.15
  - @math-blocks/semantic@0.1.2

## 0.0.14

### Patch Changes

- Updated dependencies [548281d]
- Updated dependencies [778d07d]
- Updated dependencies [0a9084e]
- Updated dependencies [a5e4ccc]
- Updated dependencies [4035999]
  - @math-blocks/semantic@0.1.1
  - @math-blocks/parser@0.0.14

## 0.0.13

### Patch Changes

- 7c4fdbe: Update isEqual to handle comparing tables
- 7c4fdbe: Parse matrices
- 0062515: Make the 'style' property mutable
- 2d0464c: Remove dependency on @math-blocks/testing
- 0062515: Update 'print' function to copy color from semantic nodes
- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
  - @math-blocks/semantic@0.1.0
  - @math-blocks/parser@0.0.13
