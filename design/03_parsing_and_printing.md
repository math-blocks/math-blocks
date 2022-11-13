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

There's also a `Parens` in all three categories.  This should only be used model
parentheses that are **unnecessary**.  We want to be able to reconstruct the
original editor tree from a semantic tree.  This is because the tutor can make
suggestions or fixes to student work and we want to be able to preserve that
part of the user's work that isn't involved in the tutor's change.  We also
want the tutor to be able to tell a user when they're using unecessary parens.

Those parens that are necessary are modeled by the nesting of sub-expressions
and the relative precedence of the operators.  From this information, necessary
parens are added in when converting a semantic tree to an editor tree.

`@math-blocks/semantic` provides types which describe these nodes as well as
some utilities for working with semantic trees.  The most important utility is
probably `traverse` which can be used to visit all nodes in a tree, but also
replace nodes. 

## Parsing

TODO: clean this up

Implements a Pratt parser factory.  The factory implements the generic parts of
the parsing algorithm, i.e. how to handle prefix, infix, and postfix operators.
Handling specific operators though is handled by
[@math-blocks/editor](editor.md) which provides the specific parselets needed
for the particular parsers it implements.

The reason for separating the factory from the parser is that even within the
editor, we implement two different parsers.  [@math-blocks/testing](testing.md)
also implements a parser for a text-only representation of the editor tree
structure.  The purpose of this text-only representation is to make writing
tests easier.

Pratt parsing is a type of top-down operator precedence parsing.  The benefit of
this type of parsing is that it's very easy to specify the precedence of
different operators.

References:
- [Pratt Parsers: Expression Parsing Made
  Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/) 

## Printing

TODO
