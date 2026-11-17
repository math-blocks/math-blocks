---
'@math-blocks/tutor': minor
---

Bring back `@math-blocks/tutor` as a smaller package that depends only on `@math-blocks/semantic` and `@math-blocks/solver`. It exports `getHint`, `showMeHow`, `checkStep`, `MistakeId` and `replaceNodeWithId`, plus the `Context`, `Correction`, `Mistake`, `Result` and `Step` types.

Compared with 0.0.10, it no longer exports the session state machine (`reducer`, `createInitialState`, `StepStatus`, `ProblemStatus`, `State` and `Action`) or `highlightMistakes`. `Step` now names the grader's step type rather than the session's. `checkStep` no longer handles vertical addition work, which `@math-blocks/semantic` no longer supports. `showMeHow` handles every `Solver.Problem` type.
