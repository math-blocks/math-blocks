---
'@math-blocks/solver': patch
---

Simplifying an expression now expands the square of a sum, e.g. `(x + 1)^2` becomes `x^2 + 2x + 1`. Squares inside a fraction are left alone so that factors can still cancel.

Distributing a product of two sums now multiplies each term of the left sum by the right sum, so `(x + 1)(x + 3)` starts with `x(x + 3) + (x + 3)` instead of `(x + 1)x + 3(x + 1)`.
