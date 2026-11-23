---
'@math-blocks/typesetter': patch
---

Lint fixes from oxlint's type-aware rules: re-export `./types` with `export type *`, since it only has types, and replace the `@ts-expect-error` comments around the cancel line in the scene graph with a typed variable. No change in behavior.
