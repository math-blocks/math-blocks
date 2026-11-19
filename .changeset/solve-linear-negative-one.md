---
'@math-blocks/solver': patch
---

Fix `solveLinear` (and `solveProblem` with `SolveLinearRelation`) leaving relations unsolved when the variable's coefficient is -1. It now multiplies both sides by -1, so `-x > 2` solves to `x < -2`, and `4b + 5 = 1 + 5b` to `b = 4` instead of `-b = -4`. If the solver can't isolate the variable, it now returns nothing instead of a step whose answer isn't solved.

Also fix `simplify` not reducing fractions with a numerator of 1 and a negative denominator, and turning `0/-b` and `0 * -1` into `-0`. `\frac{1}{-3}` now simplifies to `-\frac{1}{3}`, `\frac{0}{-1}` to `0`, and `\frac{1+2x}{-1}` to `-1-2x`.
