---
'@math-blocks/solver': patch
---

`solveQuadratic` and `solveProblem({ type: 'SolveQuadraticEquation' })` now solve quadratic equations that aren't written as `ax^2 + bx + c = 0`. When the right side isn't zero, the solver first moves every term to the left, as a new `'move all terms to one side'` step, and simplifies the left side if it needs it. A left side that's already factored, such as `(x + 2)(x + 3) = 0` or `x(x + 5) = 0`, goes straight to the "split factored equation" step. The solver now returns nothing, instead of an unsolved answer, when a factor can't be solved.
