---
'@math-blocks/grader': minor
---

Rename `@math-blocks/tutor` to `@math-blocks/grader`. Install `@math-blocks/grader` and update imports from `@math-blocks/tutor`; `@math-blocks/tutor` won't get new releases.

Breaking: remove `getHint` and `showMeHow`. The package now only exports `checkStep` and its `CheckStepResult` type. `@math-blocks/core` is no longer a dependency.
