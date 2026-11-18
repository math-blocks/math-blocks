---
'@math-blocks/tutor': minor
---

`getHint` now returns a `Hint` object, `{ strategy, step }`, instead of a `Step`. `step` is the first concrete step, and `strategy` is the strategy step it belongs to, or `null` if the solver has no strategies for that kind of problem. For `2x + 5 = 10`, `strategy.kind` is `StepKind.MoveTermsToOneSide` and `step` subtracts 5 from both sides. Callers that used the old return value can use `getHint(problem).step`. The `Hint` type is exported too. `showMeHow` still applies the first concrete step.
