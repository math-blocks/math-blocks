# @math-blocks/core

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/core/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 274cb55: Export the `OneOrMore<T>` and `TwoOrMore<T>` types: readonly arrays with at least one and at least two elements.
- 47f0afb: Lint fixes from oxlint's type-aware rules: `UnreachableCaseError` converts the value with `String()` for its message, so a symbol no longer makes the constructor throw a `TypeError`; the message for every other value is unchanged. `clone` asserts its `JSON.parse` result, which changes no behavior.

## 0.0.13

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
