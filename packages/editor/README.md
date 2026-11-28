# @math-blocks/editor

A set of framework independent tools that can be used to construct an input
component for entering/editing math expressions.

## Editor.parse

Parses an editor AST into a semantic AST.  To parse TeX, combine it with
`@math-blocks/tex`: `Editor.parse(Tex.parse('2x+5=10'))`.

- It throws on a char it doesn't recognize and on empty input, rather than
  returning a tree that doesn't match the input.
- Relations are n-ary: a chain of the same relation is a single node with one
  arg per side.  `2x=5=100` parses to an `Equals` node with three args, so
  callers that expect exactly two sides should check `args.length`.
- Exponents are right associative: `x^y^z` is `x^(y^z)`.

## Editor.reducer

A reducer containing a the logic necessary to make edits to a math expression
stored as an editor AST an update a cursor appropriately.

Besides typing (`InsertChar`, `Fraction`, ...), it has actions for moving
around and selecting, which keyboard shortcuts and on-screen keypads use:

- `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`: move the cursor. Pass
  `extend: true` to `ArrowLeft` or `ArrowRight` to extend the selection
  instead.
- `MoveToStart`, `MoveToEnd`: move to the start or end of the current row
  (`scope: 'row'`), such as a numerator or an exponent, or of the whole formula
  (`scope: 'formula'`). They take `extend: true` too.
- `ExitRow`: move out of the current row, to just after
  (`direction: 'forward'`) or just before (`direction: 'backward'`) the node
  that contains it. In the top-level row it returns the same state.
- `SelectAll`: select the whole formula.

## Editor.HistoryUtils

Keeps an undo history of editor states:

```ts
let history = HistoryUtils.create(state);
history = HistoryUtils.push(history, reducer(history.present, action));
history = HistoryUtils.undo(history); // and HistoryUtils.redo(history)
```

`push` only adds an undo step when the content changes. A state with the same
`row`, where only the cursor or selection moved, replaces the present, so undo
puts the cursor back where it was before the edit.

## Editor.State

A type describing the internal state of the reducer.
