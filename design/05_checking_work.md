# 05 Checking Work

Another important capability of an interactive math tutor is being able to check
a user's work.  In order to provide better feedback and help we want to be able
to verify that a step provided by the user is a valid step.

A naïve approach would simply check if the answer for an equation is the same
for each step shown.  This is insufficient for our needs.  Just because two
equations have the same solution, it doesn't mean than there's a logic step
between the two.

Math Blocks takes a rather novel approach to checking a user's work.  The system
contains a bunch of simple rules, things like:

- `0 * a -> 0`
- `1 * a -> a`
- multiple and addition can be reorder
- `--a -> a`
- ... _et cetera_

These rules are then recursively applied to the previous step until we end up at
the step provided by the user or not.  This results in a bunch of different
branching paths.  If we find multiple paths from one step to the next, we go
with the shortest path.  Since some actions are destructive, e.g. `0 * a -> 0`
we have to run this algorithm in reverse as well.

Since many of the rule have an inverse that can also be applied, we need to be
careful not to get into infinite loops.  To avoid this, we mark nodes in the
semantic tree as being created by the application of different rules.  If we try
to apply a rule to a node that was created by its inverse, we bail out of
applying that rule.

Depending on the complexity of the equation/expression being solved/simplified,
it may take a while to determine a valid path from one step to the next.  There
may also be valid steps that the system cannot find a path between.  This
usually means that the user is skipping steps.

## Future Work

- More rules: logarithms, absolute value, series and sequences, limits, etc.
- Investigate "big steps" which encompass multiple smaller rules as a way to
  reduce the size of the search tree
- Fallback check for when no search path can be found
- Move computation to a Web Worker so that we don't block the main thread
