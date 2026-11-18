---
'@math-blocks/tutor': patch
---

`checkStep` handles more quadratic equations. It measures each side's degree as written and passes degree-2 equations straight to the solver, which now rearranges them itself, so steps like `x^2 = 5x - 6` and `x(x + 5) + 6 = 0` can be checked. When an equation's squared terms cancel, as in `x^2 + x = x^2 + 3`, it falls back to the linear solver.
