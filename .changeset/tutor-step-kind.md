---
'@math-blocks/tutor': patch
---

Re-export `StepKind` from `@math-blocks/solver`, so callers of `getHint` can tell steps apart with `step.kind` without depending on the solver directly.
