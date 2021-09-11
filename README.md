# math-blocks

![Node CI](https://github.com/math-blocks/math-blocks/workflows/Node%20CI/badge.svg)
[![Netlify](https://img.shields.io/netlify/e7aa7c26-3f02-411d-91c8-96dea22b7e26)](https://app.netlify.com/sites/math-blocks/deploys)
[![codecov](https://codecov.io/gh/math-blocks/math-blocks/branch/master/graph/badge.svg)](https://codecov.io/gh/math-blocks/math-blocks)
[![Wallaby.js](https://img.shields.io/badge/wallaby.js-configured-green.svg)](https://wallabyjs.com)
[![TypeScript](https://camo.githubusercontent.com/d81d2d42b56e290c0d4d74eb425e19242f4f2d3d/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f74797065732f73637275622d6a732e737667)](http://www.typescriptlang.org/)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fmath-blocks%2Fmath-blocks%2Fmaster%2Fpackage.json&1)](https://github.com/plantain-00/type-coverage)

A set of tools, components, and libraries for building interactive math applications.

## Main Packages

### [@math-blocks/grader](packages/grader/README.md)

Provides feedback on a single step that user might show when solving a math
problem.  The feedback can be either "correct" or "incorrect".  In some situations,
when the step is "incorrect", the solver may also provide additional feedback
such as why the step is incorrect.  In a subset of those cases, it can also fix
the mistake for the user.

### [@math-blocks/react](packages/react/README.md)

A set of React components for rendering and editing math expressions.

- `MathRenderer`
- `ZipperEditor`

### [@math-blocks/solver](packages/solver/README.md)

Is able to solve basic equations and simplify basic expressions using steps that
are similar to what a human would do.  This can then be used by intelligent tutors
to provide suggestions to users when they don't know what step to take next or
provide a complete worked solution.

## Supporting Packages

### [@math-blocks/core](package/core/README.md)

A collection of utility functions and types used in most of the other packages.

- `getId`: function that returns unique, ascending, integer identifiers
- `UnreachableCaseError`: used for exhaustiveness checks in `switch` statements.

### [@math-blocks/editor](packages/editor/README.md)

Provides a bunch of related parts for building interactive math editors.

- `reducer`: updates an editor tree based on various editing actions.
- `parse`: converts an editor tree into a semantic tree.
- `print`: converts a semantic tree to an editor tree.
- `builders`: builders for each of the editor node types
- `utils`: other helpers

### [@math-blocks/opentype](packages/opentype/README.md)

Library for parsing OpenType font files that contain a MATH table.

### [@math-blocks/parser-factory](packages/parser-factory/README.md)

Defines a `parserFactory` function is used by `@math-blocks/testing` and
`@math-blocks/editor-parser` to define Pratt (top-down precedence) parsers.  It
also exports common `types` used by the parsers and a set of `builders` for
constructing nodes in the output of each parser.

### [@math-blocks/semantic](packages/semantic/README.md)

Provides `types`, `builders`, and `utils` for working with semantic nodes.  The
`types` are almost the same as those from `@math-block/parser-factory`, but are
more constrained to avoid invalid semantic trees.

### [@math-blocks/testing](packages/typesetter/README.md)

Implements its own text-only parser which is used for writing tests.  It's more
convenient then having to create editor trees for each test.

### [@math-blocks/typesetter](packages/typesetter/README.md)

The typesetter converts a semantic tree to a layout tree and finally a scene
graph.  The layout tree comprizes typesetting primitives while the scene graph
is more closely maps to SVG or HTML Canvas primitives.  The reason for doing
this is multiple passes is that it makes converting from one representation to
another easier to understand.
