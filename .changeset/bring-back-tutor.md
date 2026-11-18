---
'@math-blocks/tutor': minor
---

Bring back `@math-blocks/tutor` as a much smaller package that depends on `@math-blocks/semantic`, `@math-blocks/solver` and `@math-blocks/core`. It exports `getHint`, `showMeHow`, `checkStep` and the `CheckStepResult` type.

`checkStep(prev, next)` replaces the old grader. It runs the solver on both steps and compares their solutions, returning `'equivalent'`, `'not-equivalent'` or `'unknown'`. It no longer reports which rules a step applied or diagnoses mistakes, so `MistakeId`, `replaceNodeWithId` and the `Context`, `Correction`, `Mistake`, `Result` and `Step` types are gone.

Compared with 0.0.10, it also no longer exports the session state machine (`reducer`, `createInitialState`, `StepStatus`, `ProblemStatus`, `State` and `Action`) or `highlightMistakes`. `showMeHow` handles every `Solver.Problem` type.
