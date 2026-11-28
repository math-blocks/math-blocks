# @math-blocks/tex

## 0.3.0

### Minor Changes

- 06758bc: Parse ASCII `-` as subtraction and negation instead of dropping it.

  - `@math-blocks/tex`: `parse` now emits the minus sign `−` (U+2212) for `-`, matching what the editor uses everywhere else. Callers that looked for a `-` char in the returned tree will now see `−`.
  - `@math-blocks/editor`: `parse` lexes both `-` and `−` as minus, and lexes `×` and `⋅` as multiplication. It now throws `Unexpected character '…'` on a char it doesn't recognize instead of silently dropping it, so input such as `a?b` or `1/2` that used to parse to a wrong tree now throws. Whitespace between tokens is still ignored.

- 0b6402e: Support the TeX that math input fields produce.

  - `@math-blocks/tex`: `parse` supports `\div` and `\ne`, turns bare `(…)` and `|…|` into delimited nodes (the same node `\left(…\right)` produces; an unmatched delimiter stays a plain char), reads `x^-2` as `x^{-2}`, ignores trailing whitespace, and throws on a missing subscript or superscript instead of returning a char with no value.
  - `@math-blocks/editor`: `parse` handles `÷` (left associative, same precedence as `×`), `≠`, `π` (as a `Pi` node), greek letters as identifiers, `sin`, `cos`, `tan`, `cot`, `sec`, `csc`, the `arc` functions, `ln` and `log` (with an optional base) as function nodes, `\sin^{-1} x` as `arcsin(x)`, and `|…|` as `AbsoluteValue`. Exponents are now right associative (`x^y^z` is `x^(y^z)`), and empty input throws `Empty input`. Chains of the same relation, e.g. `2x=5=100`, are documented as a single n-ary node.

### Patch Changes

- 4aba637: `parse` and `print` support the hyperbolic functions `\sinh`, `\cosh`, `\tanh` and `\coth`, the common non-standard `\sech` and `\csch`, and the inverses `\arcsinh`, `\arccosh`, `\arctanh`, `\arccoth`, `\arcsech` and `\arccsch`. They used to throw `unknown command`.
- fee5f77: `parse` supports `\cup`, `\cap`, `\emptyset`, `\ldots`, `\cdots`, `\to`, `\approx`, `\perp`, `\parallel`, `\circ`, and the literal braces `\{` and `\}`, which used to throw `unknown command`. `print` prints `{` and `}` chars as `\{` and `\}`.
- 86aca5f: Fix printing semantic trees to TeX with `Tex.print(Editor.print(node))`.

  - `@math-blocks/tex`: `print` puts a space between a command name and a letter that follows it, so `x>y` prints as `x\gt y` instead of `x\gty` and `2πr` as `2\pi r`.
  - `@math-blocks/editor`: `print` handles `Pi`, `Root` (`\sqrt{…}` and `\sqrt[n]{…}`), `AbsoluteValue` (`\left|…\right|`) and `NotEquals` nodes instead of throwing.

- Updated dependencies [4aba637]
- Updated dependencies [fee5f77]
- Updated dependencies [c38c6e0]
- Updated dependencies [fee5f77]
- Updated dependencies [06758bc]
- Updated dependencies [0b6402e]
- Updated dependencies [86aca5f]
  - @math-blocks/editor@0.2.0

## 0.2.1

### Patch Changes

- Updated dependencies [cc25bba]
  - @math-blocks/editor@0.1.1

## 0.2.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/tex/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 47f0afb: Lint fix from oxlint's type-aware rules: `print` no longer wraps a macro's output in an unneeded template literal. No change in behavior.
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/core@0.1.0
  - @math-blocks/editor@0.1.0

## 0.1.2

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
  - @math-blocks/core@0.0.13
  - @math-blocks/editor@0.0.15

## 0.1.1

### Patch Changes

- @math-blocks/editor@0.0.14

## 0.1.0

### Minor Changes

- cf4d1ba: Export 'parse' function instead of 'Parser' class

### Patch Changes

- 7c4fdbe: Parse and print matrices
- Updated dependencies [7c4fdbe]
- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
- Updated dependencies [2d0464c]
- Updated dependencies [0062515]
  - @math-blocks/editor@0.0.13

## 0.0.13

### Patch Changes

- 9315712: Add 'print' function to convert an editor AST to a TeX string
