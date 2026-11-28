---
'@math-blocks/typesetter': minor
---

Breaking: the package only ships ES modules. The CommonJS build (`dist/index.js` and `dist/index.d.ts`) and the `require` condition in `exports` are gone, and `main` and `types` point at `dist/index.mjs` and `dist/index.d.mts`. Import it with `import`, or with `require` on Node 20.19 or later, where `require` can load ES modules.
