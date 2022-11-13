# math-blocks

![Node CI](https://github.com/math-blocks/math-blocks/workflows/Node%20CI/badge.svg)
[![Netlify](https://img.shields.io/netlify/e7aa7c26-3f02-411d-91c8-96dea22b7e26)](https://app.netlify.com/sites/math-blocks/deploys)
[![codecov](https://codecov.io/gh/math-blocks/math-blocks/branch/master/graph/badge.svg)](https://codecov.io/gh/math-blocks/math-blocks)
[![Wallaby.js](https://img.shields.io/badge/wallaby.js-configured-green.svg)](https://wallabyjs.com)
[![TypeScript](https://camo.githubusercontent.com/d81d2d42b56e290c0d4d74eb425e19242f4f2d3d/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f74797065732f73637275622d6a732e737667)](http://www.typescriptlang.org/)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fmath-blocks%2Fmath-blocks%2Fmaster%2Fpackage.json&1)](https://github.com/plantain-00/type-coverage)

A set of tools, components, and libraries for building interactive math
applications.  For more details see [design/README.md](design/README.md).

## Packages

- [@math-blocks/core](package/core/README.md) - A collection of utility
  functions and types used in most of the other packages. 
- [@math-blocks/editor](packages/editor/README.md) - Provides a bunch of related
  parts for building interactive math editors. 
- [@math-blocks/opentype](packages/opentype/README.md) - Library for parsing
  OpenType font files that contain a MATH table. 
- [@math-blocks/parser](packages/parser/README.md) - Provides a `parserFactory`
  function for creating TDOP parsers and related utils. 
- [@math-blocks/react](packages/react/README.md) - A set of React components for
  rendering and editing math expressions. 
- [@math-blocks/typesetter](packages/typesetter/README.md) – Converts editor
  tree to a renderer independent scene graph. 
