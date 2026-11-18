---
'@math-blocks/solver': patch
---

Add a `StepKind` enum and a `kind` field to every `Step`. `kind` is now the discriminant of `Step`, so callers can `switch (step.kind)` with exhaustive type checking instead of comparing against English strings. The enum's values are stable: new ones may be added, but existing ones won't be renamed or reused. `Step.message` still has the same text but is deprecated and will be removed in a future release. Also removes the `'test'` step, which was only meant for the solver's own tests.
