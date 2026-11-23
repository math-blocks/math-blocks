---
'@math-blocks/react': minor
---

Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

Import the stylesheet with `import '@math-blocks/react/index.css'`. The CSS module class names in it have changed (for example `editor-module_container__UsRAy` is now `rpWC2q_container`), so don't rely on the generated names.

Breaking: the `exports` map only allows importing the package root, `index.css` and `package.json`. Deep imports into `dist`, such as `@math-blocks/react/dist/index.js` or `@math-blocks/react/dist/index.css`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.
