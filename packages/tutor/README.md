# @math-blocks/tutor

Helps students work through math problems. It gives hints, shows the next
step, and checks the steps a student writes, reporting common mistakes.

It depends only on `@math-blocks/semantic` and `@math-blocks/solver`.

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
checkStep(prev: Semantic.types.Node, next: Semantic.types.Node): {
  result?: Result;
  successfulChecks: ReadonlySet<string>;
  mistakes: readonly Mistake[];
}
```

Compares two consecutive lines of a student's work. If `next` follows from
`prev`, `result.steps` lists the properties and rules that connect them, such
as "commutative property" or "adding the same value to both sides". If it
doesn't, `result` is `undefined` and `mistakes` describes what went wrong.
Each `Mistake` has a `MistakeId`, the nodes involved, and suggested
corrections.

```typescript
replaceNodeWithId(root: Semantic.types.Node, id: number, replacement: Semantic.types.Node): void
```

Replaces the node with the given `id` inside `root`. It modifies `root` in
place, so pass it a copy if you need to keep the original. Use it to apply a
mistake's corrections.
