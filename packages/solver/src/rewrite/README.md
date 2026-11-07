# Rewrite engine core

This directory holds the new rewriting core for `@math-blocks/solver`
([#629](https://github.com/math-blocks/math-blocks/issues/629)). See the
[design report](https://claude.ai/artifact/3jC1PBvstDSKgvrokRy5jR) for the
overall plan.

- A **`Rule`** is a named local rewrite. Given a node, it yields zero or more
  `Step`s. Yielding nothing means it fails.
- A **`Strategy`** decides where and when rules are applied. Given a node, it
  returns a `Trace`.
- A **`Trace`** lists the strategy's alternatives at one point, most preferred
  first. Each alternative is either `done` (here is the final result) or a
  `step` (here is the step taken, the result after it, and a `next()` function
  that returns the trace from there).

A strategy only sees the node it's applied to, so its results are that node
rewritten, not the top-level expression. When a traversal combinator applies a
strategy at a subterm, it rebuilds the enclosing expression around the result.

Step messages are type-checked against the existing `Step['message']` union in
`../types.ts`, because rules produce `Step` values.

## Enumeration vs. single-step execution

The obvious design is for a strategy to return one result, `Step | undefined`,
the way transforms do today. That can only answer "what does the solver do
next?" The tutoring services planned for Rewrite Engine 5 also need to list
the steps a student could reasonably take next (next-step hints), and to
recognize which rule a student's step applied so that feedback can name it.
Both need every alternative, not only the one the solver picks. Retrofitting
that onto single-result combinators would mean rewriting them, so the result
type supports both from the start.

Strategies don't decide whether a student's step is valid. A student may take
any valid step, including ones no strategy would suggest, such as adding the
same arbitrary expression to both sides of an equation. The tutor checks a
step by comparing the problem before and after it: an equation step is valid
if the new equation has the same solutions as the previous one. Matching the
step against a strategy's alternatives only adds detail, such as which rule
the student used or whether the step moved toward a solution.

A `Trace` is a lazy tree of every derivation the strategy allows:

```
trace
├─ step A  (preferred) ── next() ─┬─ step C ── next() ── done
│                                 └─ done
└─ step B ── next() ── done
```

- **Single-step execution:** `run(strategy, node)` follows the first
  alternative at each point and returns the steps taken and the final
  expression. This is what `simplify()` will use.
- **Enumeration:** the `step` branches at the top of `strategy(node, context)`
  are all the candidate next steps, in preference order.

Both are lazy. A trace is an `Iterable` (usually a generator), and the rest of
a derivation is only computed when `next()` is called. `run` computes only the
preferred path, and listing the next steps computes nothing past them.

### Dead ends

A combinator such as `seq(a, b)` has to report `a`'s step before it knows
whether `b` will succeed afterwards. Otherwise it would have to run ahead,
which would defeat the laziness. So the trace returned by `next()` may be
empty. That means the step was allowed, but the strategy can't finish after
it. `run` backtracks past dead ends to the next alternative. An enumeration
service that must only offer steps that lead somewhere can check a
candidate's continuation with `run`.

### Traces are single-use

Generators can only be iterated once. Code that needs to look at a trace's
alternatives more than once (for example, a left-biased `choice` that checks
whether its first strategy has any alternatives) must buffer what it reads.

### Paths

`Context.path` holds the ancestors of the node being rewritten, root first,
not including the node. This is the same `path` that `simplify()` passes to
transforms today. Each `step` branch records the full path to the rewritten
subterm, which later services can use to point at the part of the expression
a step applies to.
