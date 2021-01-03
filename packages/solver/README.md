# @math-blocks/solver

Is able to solve basic equations and simplify basic expressions using steps that
are similar to what a human would do.  This can then be used by intelligent tutors
to provide suggestions to users when they don't know what step to take next or
provide a complete worked solution.

## API
```typescript
const solve = (node: types.Eq, ident: types.Ident) => Step | undefined;
```

Solves an equation for the given identifier.  If the identifier doesn't exist
in `node` or if `solve` doesn't know how to solve the given equation the function
will return `undefined`.

```typescript
const simplify = (node: types.Node) => Step | undefined;
```

Simplifies an expression.  It will return `undefined` if the expression is already
simplified.

```typescript
type Step = {
    message: string;
    before: types.Node;
    after: types.Node;
    substeps: Step[];
};
```

`Step` is a common type that's used throughout this package to communicate what
each step is doing.  `before` is the node that is being changed within a step and
may be a descendent of the `node` passed to `solve` or `simplify`.  `after` is 
the node that `before` has been replaced with.  Use `applyStep` to compute the
new node after applying the step to `node`.

```typescript
const applyStep = (node: types.Node, step: Step): types.Node;
```

Applies a single step to a given node.  If step couldn't be applied, the original
`node` is returned.

## Notes

Each function that performs steps to simplify an expression or solve an equation
should have the following properties:
- applying all substeps to the `before` should result in a node that is the same
  as `after`
- applying each substep to an expression or equation should result in an equivalent
  expression or equation
  - equivalent expressions have the same value no matter the value of the variables
  - equivalent equations should have all of the same solutions

## TODO
- create a helper to check that two expressions are equivalent
- create a helper to check that two equations are equivalent
- update `solve` to handle linear inequalities
- add tests to check that the general equation of a line can be rewritten in
  standard for by solving for `y`
