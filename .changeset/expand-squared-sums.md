---
'@math-blocks/solver': patch
---

Simplifying an expression now expands the square of a sum, e.g. `(x + 1)^2` becomes `x^2 + 2x + 1`. Squares inside a fraction are left alone so that factors can still cancel.
