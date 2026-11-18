# @math-blocks/tutor

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
