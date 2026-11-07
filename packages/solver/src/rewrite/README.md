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
next?" Several planned features need every alternative, not only the one the
solver picks:

- **Classifying a student's step**
  ([#660](https://github.com/math-blocks/math-blocks/issues/660)). A strategy
  often allows several equally good steps. In `2x + 3y + 4x + 5y` it could
  combine the `x` terms or the `y` terms first. A student who does either has
  taken an expected step, not a detour, and telling those apart needs the
  whole set. Recognizing a micro-step (one substep of a step) also starts from
  the candidate steps.
- **Choosing the preferred step**
  ([#657](https://github.com/math-blocks/math-blocks/issues/657)). A hint only
  shows one step, but picking it means comparing the candidates with a
  tie-break (avoid fractions, keep coefficients positive, prefer the leftmost
  position).
- **Explaining combined steps**
  ([#661](https://github.com/math-blocks/math-blocks/issues/661)). When a
  student combines several steps into one, the tutor searches short sequences
  of rule applications for ones that reach the student's expression. The
  search has to try every way each rule can apply.
- **Backtracking.** If the preferred step leads to a dead end (see below),
  `run` falls back to the next alternative.

This is also why a single rule can yield more than one step. A pattern can
match the same node in more than one way, such as the `x` terms or the `y`
terms in the sum above. And some nodes can be rewritten correctly in more than
one way: `12/18` can be reduced to `2/3` in one step or to `6/9` first, and a
student who writes `6/9` has taken a valid step.

Retrofitting alternatives onto single-result combinators would mean rewriting
them, so the result type supports both from the start.

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
candidate's continuation with `firstDerivationOf(branch.next())`.

### Traces are single-use

Generators can only be iterated once. Code that needs to look at a trace's
alternatives more than once must buffer what it reads. The combinators avoid
this by passing each branch on as they read it: for example, `choice` yields
its first strategy's branches as it reads them, and only moves on to the next
strategy if there were none.

### Paths

`Context.path` holds the ancestors of the node being rewritten, root first,
not including the node. This is the same `path` that `simplify()` passes to
transforms today. Each `step` branch records the full path to the rewritten
subterm, which later services can use to point at the part of the expression
a step applies to.

## Combinators

`combinators.ts` builds strategies from other strategies, using Stratego's
names where possible:

- `identity`: finishes unchanged without a step.
- `seq(a, b, ...)`: applies each strategy to the result of the one before.
- `choice(a, b, ...)`: uses the first strategy that applies.
- `tryS(s)`: `s` if it applies, otherwise `identity`.
- `repeat(s, { max })`: applies `s` until it no longer applies, at most `max`
  times.
- `named(message, s)`: groups the steps of each derivation of `s` into one
  step with `message`, with those steps as its `substeps`.
- `guard(predicate, s)`: `s` if `predicate` holds for the node, otherwise
  fails.

`choice` is left-biased in the same way as the Ideas framework's: a strategy
applies if it can take a first step or finish without one. It doesn't look
further ahead, so `choice(seq(a, b), c)` commits to `seq(a, b)` once `a`
applies, even if `b` then fails. This differs from Stratego's `<+`, which
would fall back to `c`. Looking ahead would mean computing a derivation before
offering its first step, which would defeat the laziness.

`derivationsOf(trace)` in `trace.ts` lazily lists every complete derivation of
a trace. `named` uses it to find the derivations it groups.
