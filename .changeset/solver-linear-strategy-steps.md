---
'@math-blocks/solver': minor
---

Group the steps of linear-relation solutions by strategy. The substeps of a `StepKind.SolveForVariable` step are now strategy steps, and their substeps are the concrete operations:

- `StepKind.SimplifyBothSides`, `StepKind.SimplifyLeftHandSide` or `StepKind.SimplifyRightHandSide` to simplify the relation first.
- `StepKind.MoveTermsToOneSide` to move terms by adding or subtracting them on both sides.
- `StepKind.IsolateVariable` (new) to remove the variable's coefficient by multiplying or dividing both sides.

For example, the first substep of the solution to `2x + 5 = 10` is now a `MoveTermsToOneSide` step whose first substep subtracts 5 from both sides. Previously it was the "subtract 5" step itself, so callers that read the `substeps` of a `SolveForVariable` step directly will see different steps.
