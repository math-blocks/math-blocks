---
'@math-blocks/solver': patch
---

Fix declared dependencies: add `fraction.js`, which the solver loads at runtime, and stop listing `@math-blocks/core`, `@math-blocks/editor`, `@math-blocks/parser` and `@math-blocks/tex`, which it never loads. The editor and TeX packages are only used by tests, so they're now dev dependencies.
