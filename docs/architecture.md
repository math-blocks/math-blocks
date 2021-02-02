# Architecture

## High Level

`math-blocks` is consists of two main groups of software:
- demo applications
- libraries and components

The demo applications provide a platform to test various user facing features
like checking steps, provide hints, or showing a student how to do a particular
problem.

The libraries and components support these features but could also be reused to
create other applications.  They're broken down into a number of packages so
that you only need to include those bits that you use.  For instance, the react
renderer can be used without requiring any bits of the editor.


## Data Structures

In order to support the intended user facing features, we need a way to store
mathematical expressions as data.  The data structure has the following principles:

- easy to manipulate
- easy to serialize/deserialize (supports storage and transmission)
- doesn't include unnecessary nodes
- maps well to math concepts

These principles resulted in the following design choices:

- All data no methods.  All manipulation is done via library functions that are
  completely dissociated from the data itself.  This also allows us to use
  `JSON.parse` and `JSON.stringify` without difficulty.

The data structure is a tree with nodes to model operations (addition, mulitplication,
etc.) and operands (numbers, identifiers, etc.).

- Addition and multiplication are n-ary
- Negation and subtraction are modeled using the same node type with a boolean
  indicating which operation it is
- Order of operation is determined by the structure of the tree
- The is a `parens` node that can be used to represent unecessary parentheses
  around an expression, e.g. `(1) + 2`

Questions:
- why not use an existing data structure?
  - math.js:
    - models addition and multiplication as binary expressions which makes
      working with expression like `1 + 2 + 3 + ...` much more difficult
    - includes explicit `parens` nodes even when it isn't necessary, e.g.
      `a * (b + c)`
    - fluent API so nodes have methods on them which makes (de)serialization
      more difficult
  - MathML (Content Markup): I used this for inspiration but it has a number of
    drawbacks
    - it's XML which makes it harder to use on web and it means we can't use
      `JSON.stringify`/`JSON.parse` for simple serialization/deserialization
    - it relies on children too much.  You specify a `bvar` (bound variable) as
      a child of an integral as opposed to a attribute of the integral node
      itself.  You'd have to loop over all of the children to find things which
      sounds annoying.
  - OpenMath:
    - ...

- why not use existing libraries?
  - math-steps:
    - uses math.js under the hood so it inherits its flaws
  - ...


Downsides of using JSON:
- there's no versioning/schema
  - Enforcing all of the constraints I wanted was difficult/impossible using
    JSONSchema.  In particular the children of `eq` is either an array of
    numeric nodes, an array of logic nodes, or an array of set nodes.




## Typesetting and Rendering Mathematics

We intentionally split up the process of into a number of steps.  This is in
order to make each step easier to understand but also to enable rendering using
different frontend (React, SVG, HTML5 Canvas, CoreGraphics, etc.).

Editing tree -> Layout tree -> Scene Graph -> Rendering frontend


TODO:
- make a graph that shows the relationship between all of the different data
  types and which function (from which package) is used to convert between them.



## Editing

The editor has its own tree structure that models horizontal runs of characters
along with a small number of vertical layouts.  It's comprised of the following
node types:

- `Row`: horizontal run of glyphs (or tokens)
- `Frac`: two `Row`s representing the numerator and denominator
- `SubSup`: one `Row` for a subscript, or one `Row` for a superscript, or both
- `Root`: one `Row` for the radicand and optionally one `Row` for the index
- `Limits`: one `Row` for the lower limit and optionally one `Row` for the upper
  limit.  The limits are typeset above and below an "inner" node.  This is used
  to describe things like limits, summation, integrals, etc.
- `Atom`: can be used to store either glyphs or tokens, see [Parsing](#Parsing)
  for more details.





## Parsing

There's actually two parts to parsing: lexing and parsing.

Both the editor and testing packages have parser.  These two parsers are both
Pratt (or Top Down Operator Precedence) parsers and share some common machinery.
This machinery is provided by the `parser-factory` package.  This package
provides a `parserFactory` function.  Given a parser specification including
the precedence of the operators you wish to support along with parselets which
parse the operations it will return an object with a `parse` method.

More details on Pratt parsers can be found at [TODO](find-link-to-article).
The thing that's important is that the operators and their precedence can be
shared across multiple parsers generated by `parserFactory` even if the input
stream for those parsers is different.  In our case the editor is parsing an
Editor tree of tokens and the testing package is parsing a simple string.

Another benefit of using this type of parser is that it's very easy to change
the precedence of operators.  Recursive decent parsers and most parser generators
require a deep hierarchy to describe precedence.  Making changes to this
hierarchy can be quite troublesome to make after the fact.

Lexing converts an array of strings/glyphs to an array of tokens before passing
the tokens to the parser object.  Some example tokens:

- identifiers: `x`, `y`, `log`, `sin`, `π`, etc.
- numbers: `5`, `1.23`, `-1`, etc.
- operators: `+`, `-`, `=`, `<=`, etc.

These token definitions should be shared between the two parsers.

## Testing

Since we have lots of different functions manipulating the Semantic tree, it
would be nice not to have to manually construct the tree data structure for
each expression we want to work with.  Instead the `testing` package provides
a text based grammar with `parse` and `print` functions to convert text to a
tree structure and back again.

This functionality is used in many of the unit tests in a number of packages.
The text based grammar is not intended for use either by users or as some sort
of internal storage format by developers.  It is subject to change at any time
and is only meant to support testing efforts.

`print` has an option to generate a string that is not a 1:1 conversion from
two different Semantic trees.  This is used in a couple of library functions
when dealing with expressions that have ambiguous interpretations.  For example
`-2x` can be interpreted as `-(2x)` or `(-2)(x)`, but normally a user would
write `-2x` without differentiating which interpretation they meant.  Internally
though we always parse `-2x` as `-(2x)` and will convert to `(-2)(x)` as needed.
The reason why `print` has an option to print both `-(2x)` and `(-2)(x)` as `-2x`
is to help as avoid showing users steps that they normally wouldn't care about.

The process of hiding these unhelpful steps is called elision.
