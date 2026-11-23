---
'@math-blocks/opentype': minor
---

Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/opentype/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.
