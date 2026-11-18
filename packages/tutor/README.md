# @math-blocks/tutor

Helps students work through math problems. It gives hints, shows the next
step, and checks whether a step a student writes is valid.

It depends on `@math-blocks/semantic` and `@math-blocks/solver`, plus `@math-blocks/core` for shared helpers.

## API

```typescript
getHint(problem: Solver.Problem): Solver.Step
```

Returns the first step a student should take to make progress on `problem`.
Throws if the solver can't make progress, for example because the expression
is already simplified.

```typescript
showMeHow(problem: Solver.Problem): Semantic.types.Node
```

Applies the step from `getHint` and returns the resulting expression or
relation.

```typescript
checkStep(prev: Semantic.types.Node, next: Semantic.types.Node): CheckStepResult
```

Checks whether `next` is a valid step from `prev` by running the solver on
both and comparing their solutions:

- Expressions are simplified.
- Equations and inequalities are solved for their variable. Both steps must
  use the same single variable.

The result's `status` is one of:

- `'equivalent'`: both steps have the same solution, returned as `answer`.
- `'not-equivalent'`: the solutions differ. Both are returned, as
  `prevAnswer` and `nextAnswer`.
- `'unknown'`: the solver couldn't solve one of the steps, so `checkStep`
  can't tell. `reason` says why.

The comparison ignores differences that don't change the meaning:

- the order of terms and factors
- which side of an equation is which, and flipped inequalities such as
  `x < 3` and `3 > x`
- implicit versus explicit multiplication
- the order of a quadratic's solutions

Two identities, such as `0 = 0` and `1 = 1`, count as equivalent. So do two
contradictions.

`checkStep` only says whether a step is valid. It doesn't say which rule the
student applied, or what mistake they made.
