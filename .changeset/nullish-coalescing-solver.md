---
'@math-blocks/solver': patch
---

Lint fix from `prefer-nullish-coalescing`: the `multiply-powers` and `divide-powers` transforms use `??` instead of `||` for array fallbacks. No change in behavior.
