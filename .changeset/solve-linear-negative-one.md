---
'@math-blocks/solver': patch
---

Fix `solveLinear` (and `solveProblem` with `SolveLinearRelation`) leaving relations unsolved when the variable's coefficient is -1. `-x > 2` now solves to `x < -2`, and `4b + 5 = 1 + 5b` to `b = 4` instead of `-b = -4`. If the solver can't isolate the variable, it now returns nothing instead of a step whose answer isn't solved.
