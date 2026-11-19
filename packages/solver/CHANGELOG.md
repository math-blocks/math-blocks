# @math-blocks/solver

## 0.0.15

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- e9dd416: Fix `solveLinear` (and `solveProblem` with `SolveLinearRelation`) leaving relations unsolved when the variable's coefficient is -1. It now multiplies both sides by -1, so `-x > 2` solves to `x < -2`, and `4b + 5 = 1 + 5b` to `b = 4` instead of `-b = -4`. If the solver can't isolate the variable, it now returns nothing instead of a step whose answer isn't solved.

  Also fix `simplify` not reducing fractions with a numerator of 1 and a negative denominator, and turning `0/-b` and `0 * -1` into `-0`. `\frac{1}{-3}` now simplifies to `-\frac{1}{3}`, `\frac{0}{-1}` to `0`, and `\frac{1+2x}{-1}` to `-1-2x`.

- Updated dependencies [7d29fdc]
- Updated dependencies [5422428]
- Updated dependencies [c9c0185]
  - @math-blocks/semantic@0.1.2

## 0.0.14

### Patch Changes

- 8abe461: Simplifying an expression now expands the square of a sum, e.g. `(x + 1)^2` becomes `x^2 + 2x + 1`. Squares inside a fraction are left alone so that factors can still cancel.

  Distributing a product of two sums now multiplies each term of the left sum by the right sum, so `(x + 1)(x + 3)` starts with `x(x + 3) + (x + 3)` instead of `(x + 1)x + 3(x + 1)`.

- 4035999: Fix declared dependencies: add `fraction.js`, which the solver loads at runtime, and stop listing `@math-blocks/core`, `@math-blocks/editor`, `@math-blocks/parser` and `@math-blocks/tex`, which it never loads. The editor and TeX packages are only used by tests, so they're now dev dependencies.
- Updated dependencies [548281d]
- Updated dependencies [778d07d]
- Updated dependencies [0a9084e]
- Updated dependencies [a5e4ccc]
  - @math-blocks/semantic@0.1.1

## 0.0.13

### Patch Changes

- 4507a65: Remove uses of 'print' from non-test code
- 43efdf8: Initial support for differentiation
- 2d0464c: Remove dependency on @math-blocks/testing
- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [cf4d1ba]
- Updated dependencies [0062515]
- Updated dependencies [0062515]
- Updated dependencies [2d0464c]
- Updated dependencies [0062515]
- Updated dependencies [7c4fdbe]
  - @math-blocks/editor@0.0.13
  - @math-blocks/semantic@0.1.0
  - @math-blocks/tex@0.1.0
  - @math-blocks/parser@0.0.13
