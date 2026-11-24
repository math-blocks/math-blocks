# @math-blocks/grader

## 0.3.0

### Minor Changes

- 0dc30d7: Rename `@math-blocks/tutor` to `@math-blocks/grader`. Install `@math-blocks/grader` and update imports from `@math-blocks/tutor`; `@math-blocks/tutor` won't get new releases.

  Breaking: remove `getHint` and `showMeHow`. The package now only exports `checkStep` and its `CheckStepResult` type. `@math-blocks/core` is no longer a dependency.

- 0dc30d7: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/grader/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
  - @math-blocks/semantic@0.2.0
  - @math-blocks/solver@0.1.0

## 0.2.0

### Minor Changes

- 5422428: `checkStep` compares numeric answers by their exact values, however they're written, so `2x + 5 = 10 -> x = 2.5` and `x + 3 = 5 -> x = 4/2` are now `'equivalent'`. Answers that aren't numeric are compared as written, as before.

  An `'equivalent'` result has a new `simplified` field that says whether `next` is a finished answer in simplest form (see `util.isSimplifiedNumber` in `@math-blocks/semantic`): `x = 2.5` and `x = 5/2` are simplified, while `x = 5 * 1/2`, `x = 10/4` and `2x = 5` aren't. Callers can use it to accept a correct step but still ask for the answer to be simplified. Answers that aren't numbers, such as `5x`, aren't considered simplified yet.

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
- Updated dependencies [5422428]
- Updated dependencies [c9c0185]
- Updated dependencies [e9dd416]
  - @math-blocks/core@0.0.13
  - @math-blocks/semantic@0.1.2
  - @math-blocks/solver@0.0.15

## 0.1.0

### Minor Changes

- 31e7353: Bring back `@math-blocks/tutor` as a much smaller package that depends on `@math-blocks/semantic`, `@math-blocks/solver` and `@math-blocks/core`. It exports `getHint`, `showMeHow`, `checkStep` and the `CheckStepResult` type.

  `checkStep(prev, next)` replaces the old grader. It runs the solver on both steps and compares their solutions, returning `'equivalent'`, `'not-equivalent'` or `'unknown'`. It no longer reports which rules a step applied or diagnoses mistakes, so `MistakeId`, `replaceNodeWithId` and the `Context`, `Correction`, `Mistake`, `Result` and `Step` types are gone.

  Compared with 0.0.10, it also no longer exports the session state machine (`reducer`, `createInitialState`, `StepStatus`, `ProblemStatus`, `State` and `Action`) or `highlightMistakes`. `showMeHow` handles every `Solver.Problem` type.

### Patch Changes

- Updated dependencies [8abe461]
- Updated dependencies [548281d]
- Updated dependencies [778d07d]
- Updated dependencies [0a9084e]
- Updated dependencies [a5e4ccc]
- Updated dependencies [4035999]
  - @math-blocks/solver@0.0.14
  - @math-blocks/semantic@0.1.1
