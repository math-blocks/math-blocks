# @math-blocks/parser

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/parser/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

## 0.0.15

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.

## 0.0.14

### Patch Changes

- 4035999: Stop listing `@math-blocks/core` and `@math-blocks/semantic` as dependencies. The parser never imports either one.

## 0.0.13

### Patch Changes

- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
  - @math-blocks/semantic@0.1.0
