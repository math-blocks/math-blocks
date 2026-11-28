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

## Editor.State

A type describing the internal state of the reducer.
