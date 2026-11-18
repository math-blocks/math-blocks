# @math-blocks/solver

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
