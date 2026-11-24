# @math-blocks/tex

## 0.2.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/tex/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 47f0afb: Lint fix from oxlint's type-aware rules: `print` no longer wraps a macro's output in an unneeded template literal. No change in behavior.
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/core@0.1.0
  - @math-blocks/editor@0.1.0

## 0.1.2

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
  - @math-blocks/core@0.0.13
  - @math-blocks/editor@0.0.15

## 0.1.1

### Patch Changes

- @math-blocks/editor@0.0.14

## 0.1.0

### Minor Changes

- cf4d1ba: Export 'parse' function instead of 'Parser' class

### Patch Changes

- 7c4fdbe: Parse and print matrices
- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
- Updated dependencies [2d0464c]
- Updated dependencies [0062515]
  - @math-blocks/editor@0.0.13

## 0.0.13

### Patch Changes

- 9315712: Add 'print' function to convert an editor AST to a TeX string
