# 03 Parsing and Printing

Beyond just editing and rendering of math expressions, we want to be able to
determine their semantic meaning and manipulate them in various ways.

In order to support these requirements, we need to parse the editor tree into a
semantic tree.

## Semantic Tree

The nodes in the semantic tree fall into three main categories:

- `NumericNode`: anything that could evaluate to a numeric value, e.g. numbers,
  identifiers, arithmetic operators, summation, limits, integrals, etc.
- `LogicNode`: anything that could evaluate to a boolean value, e.g. equalities,
  inequalities, identifiers, logic operators, element (not) in set, subset, etc.
- `SetNode`: anything that could evaluate to a set, e.g. sets, identifiers,
  well-known sets (integers, rationals, etc.), set operations (union,
  intersection, etc.)

`Identifier` nodess appear in all three categories.  The plan is to add a
context object that tracks what type of value is stored in identifiers.  This
will be used to determine if an expression is semantically valid or not.  Since
the tutor currently supports basic algebraic equations, the assumption is that
all identifiers are numeric.  That will change sometime in the future.

```ts
// 2(x + 1)
const semantic = {
    type: "mul",
    id: 1,
    implicit: true,
    args: [
        {type: "number", value: "2"},
        {type: "add", args: [
            {type: "identifier", value: "x"},
            {type: "number", value: "1"},
        ]}
    ]
}
```

### Losslessness

We'd like to be able to reconstruct the original editor tree from the semantic
tree.  This is useful when we want to modify part of an expression that a user
has provided, but don't want to modify unrelated parts of the expression.  To
this end, the semantic tree has the following features:

- Numbers are stored as strings - this is so that we can preserve their exact
  value.
- Multiplication can be implicit `2x` or explicit `2 * x`.  NOTE: We don't have
  a way yet to differentiate between different explicit multiplication
  operators.
- Parentheses are not stored in the tree except for **unnecessary** parentheses.
  This is because the unnecessary ones can be reconstructred from the semantic
  tree.

### Traversal and Modification

`@math-blocks/semantic` provides types which describe these nodes as well as
some utilities for working with semantic trees.  The most important utility is
probably `traverse` which can be used to visit all nodes in a tree, but also
replace nodes.

## Parsing

The parser is implemented as a Pratt parser.  Pratt parsers are a good choice
for parsing expressions because it's easy to specify the precedence of different
operations and easily make changes if necessary.

There is a parser factory which implements basic handling of prefix, infix, and
postfix operators.  The actual parser is implemented by providing specific
callbacks for each of these handle the various operators (and operands) that we
want to handle. 

The parser is a little different from traditional parsers.  Instead of the input
being a string of characters, the input is actually a tree structure (an editor
tree to be exact).  Because of this, lexing, which converts individual chars or
groups of chars to tokens has to been done differently.  Instead of lexing the
whole input at once, we lex a `CharRow` whenever the parser encounters one.
This converts it to a `TokenRow` which the parser then parses.

The reason for having a parser factory is that we also have parser that takes a
text-only representation of math as an input instead of an editor tree.  This is
used to make test writing easier.

References:
- [Pratt Parsers: Expression Parsing Made
  Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/) 

## Printing

Printing is the opposite of parsing and converts a semantic tree into an editor
tree (or a string representation for writing tests).  This is useful when you
want to visualize math that was generated as a semantic tree.

## Future Work

- Parse more things: logarithms, trig functions, units of measure, etc.
- Semantic checks based on context, e.g. `A` is a matrix vs `A` is a boolean
- Address gaps in semantic tree: mismatch delimeters (interval notation),
  different operators for explicit multiplication, etc.
- Options to parse things differently, e.g. `(0, 1)` could be an interval from
  `0` to `1` or it could be a point on the cartesian plane
- Reorganize the packages to be better named and more targetted
