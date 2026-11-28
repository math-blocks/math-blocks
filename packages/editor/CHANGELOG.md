# @math-blocks/editor

## 0.2.0

### Minor Changes

- 4aba637: `parse` supports the hyperbolic functions `sinh`, `cosh`, `tanh`, `coth`, `sech` and `csch` and their inverses `arcsinh`, `arccosh`, `arctanh`, `arccoth`, `arcsech` and `arccsch`, whether they come from a single char, such as the one `Tex.parse` creates for `\sinh`, or are typed one letter at a time. `\sinh^{-1} x` is `arcsinh(x)`, like `\sin^{-1} x` is `arcsin(x)`.

  Breaking: because the longest name wins, typed `sinhx` is now `sinh(x)` rather than `sin(h·x)`, and likewise `cosh`, `tanh`, `coth`, `sech` and `csch`. Put a space after the name, as in `sin hx`, to get the old reading. `\sinh x` used to throw `'sinh' isn't supported yet`.

- fee5f77: `parse` handles many more symbols, and names the ones it doesn't support yet.

  - New nodes: `∞` (`Infinity`), `∅` (`EmptySet`), `ℕ ℤ ℚ ℝ ℂ` (the number sets), `∈ ∉` (`In`, `NotIn`), `∋ ∌` (`In`, `NotIn` with the arguments swapped), `⊆ ⊂ ⊇ ⊃` (`Subset`, `ProperSubset`, `Superset`, `ProperSuperset`), `∪ ∩` (`Union`, `Intersection`), `…` and `⋯` (`Ellipsis`), `∓` (`MinusPlus`, `UnaryMinusPlus`), sums and products with limits (`Sum`, `Product`), `lim` with a subscript such as `x→0` (`Limit`), `mod` (`Mod`) and `det` (`Determinant`).
  - Sums and products are recognized whether the operator is `∑`/`∏`, which `Tex.parse` and the editor create, or the Greek capitals `Σ`/`Π`, and whether the limits are in a limits node or a subsup that follows the operator.
  - Breaking: `a ± b` now parses to a `PlusMinus` node instead of an `Add` node that dropped the `±`. In a chain with `+` or `-`, such as `a + b ± c`, the operand after the `±` is wrapped in `UnaryPlusMinus`.
  - Breaking: brackets and braces, e.g. `\left[a\right]` or a `[…]` delimited node from the editor, now throw `'[' isn't supported yet` instead of parsing as parentheses.
  - Symbols that are valid math but have no semantic node yet throw `'…' isn't supported yet` instead of `Unexpected character '…'`: arrows, `ℍ`, `ℙ`, integrals, `/` (with a hint to use a fraction), `!`, `'`, `%`, `:`, `;`, brackets, braces, `≈`, `⊥`, `∥` and `∘`. Named functions such as `max` throw `'max' isn't supported yet` instead of `Unsupported function 'max'`, and accents throw `'\vec' isn't supported yet`. Other unknown chars still throw `Unexpected character '…' (U+…)`.

- c38c6e0: `parse` lexes chars with a table-driven scanner instead of a regex, which fixes several lexing bugs and recognizes every function name typed one letter at a time.

  - New: `parse(input, options?)` takes an optional `ParseOptions` object, and the `ParseOptions` type is exported. With `requireBackslash: true`, only a char that holds a whole name, such as the one `Tex.parse` creates for `\sin`, is a function or operator, and letters typed one at a time are always single-letter identifiers.
  - Breaking: by default, every function or operator name the parser knows is recognized when it's typed one letter at a time, not just `sin`, `cos` and `tan`: `cot`, `sec`, `csc`, `arcsin` and the other inverse trig functions, `ln`, `log`, `det`, `mod` and `lim`. The longest name wins and names are case-sensitive, so `arcsinx` is `arcsin(x)` and `SINx` is `S·I·N·x`. Typed `lnx` used to be `l·n·x`.
  - Breaking: names without a semantic node yet throw `'max' isn't supported yet` when typed one letter at a time, as they already did for `\max`: `arg`, `min`, `max`, `lcm`, `gcd`, `limsup`, `liminf`, `span`, `rank`, `null`, `adj`, `proj`, `ker` and `dim`. Pass `requireBackslash: true` to lex them as single letters instead.
  - Breaking: capital Greek letters such as `Σ` or `Γ`, and other chars that only matched because the regex ignored case (`µ`, `ϑ`, `ϕ`, `ϖ`, `ϰ`, `ϱ`, `ϵ`, `ϐ`), throw `Unexpected character` instead of becoming identifiers. `Σ` and `Π` are still accepted as the operator of a limits node.
  - Fix: a number with a second decimal point, such as `1.2.3`, throws `'1.2.3' has more than one decimal point` instead of lexing as `1.2` followed by `.3`.
  - Fix: `1...` lexes as `1` followed by an ellipsis instead of throwing on the leftover `..`.

- 06758bc: Parse ASCII `-` as subtraction and negation instead of dropping it.

  - `@math-blocks/tex`: `parse` now emits the minus sign `−` (U+2212) for `-`, matching what the editor uses everywhere else. Callers that looked for a `-` char in the returned tree will now see `−`.
  - `@math-blocks/editor`: `parse` lexes both `-` and `−` as minus, and lexes `×` and `⋅` as multiplication. It now throws `Unexpected character '…'` on a char it doesn't recognize instead of silently dropping it, so input such as `a?b` or `1/2` that used to parse to a wrong tree now throws. Whitespace between tokens is still ignored.

- 0b6402e: Support the TeX that math input fields produce.

  - `@math-blocks/tex`: `parse` supports `\div` and `\ne`, turns bare `(…)` and `|…|` into delimited nodes (the same node `\left(…\right)` produces; an unmatched delimiter stays a plain char), reads `x^-2` as `x^{-2}`, ignores trailing whitespace, and throws on a missing subscript or superscript instead of returning a char with no value.
  - `@math-blocks/editor`: `parse` handles `÷` (left associative, same precedence as `×`), `≠`, `π` (as a `Pi` node), greek letters as identifiers, `sin`, `cos`, `tan`, `cot`, `sec`, `csc`, the `arc` functions, `ln` and `log` (with an optional base) as function nodes, `\sin^{-1} x` as `arcsin(x)`, and `|…|` as `AbsoluteValue`. Exponents are now right associative (`x^y^z` is `x^(y^z)`), and empty input throws `Empty input`. Chains of the same relation, e.g. `2x=5=100`, are documented as a single n-ary node.

### Patch Changes

- fee5f77: The string helpers in `util` (`row`, `frac`, `sqrt`, `root`, `sup`, `sub` and `subsup`) make one char per code point instead of per UTF-16 code unit, so a character outside the BMP, such as `𝑥` (U+1D465), becomes a single char rather than two broken surrogate chars.
- 86aca5f: Fix printing semantic trees to TeX with `Tex.print(Editor.print(node))`.

  - `@math-blocks/tex`: `print` puts a space between a command name and a letter that follows it, so `x>y` prints as `x\gt y` instead of `x\gty` and `2πr` as `2\pi r`.
  - `@math-blocks/editor`: `print` handles `Pi`, `Root` (`\sqrt{…}` and `\sqrt[n]{…}`), `AbsoluteValue` (`\left|…\right|`) and `NotEquals` nodes instead of throwing.

- Updated dependencies [f933327]
- Updated dependencies [4aba637]
  - @math-blocks/semantic@0.2.1

## 0.1.1

### Patch Changes

- cc25bba: Lint fixes from `prefer-nullish-coalescing`: the `subsup` reducer and the token builders use `??` instead of `||` for object fallbacks. No change in behavior.

## 0.1.0

### Minor Changes

- 71b9d02: Build with tsdown instead of Rollup. The package now ships an ES module build (`dist/index.mjs`, typed by `dist/index.d.mts`) alongside the CommonJS build (`dist/index.js`, typed by `dist/index.d.ts`), and adds an `exports` map in `package.json` that picks the right one for `import` and `require`.

  Breaking: the `exports` map only allows importing the package root (and `package.json`). Deep imports into `dist`, such as `@math-blocks/editor/dist/index.js`, no longer resolve. Declaration files for internal modules, tests and stories are no longer published; `dist/index.d.ts` and `dist/index.d.mts` hold the whole public API.

### Patch Changes

- 47f0afb: Lint fixes from oxlint's type-aware rules in the `frac` and vertical-movement reducers (an optional chain and an explicit `default` case). No change in behavior.
- Updated dependencies [274cb55]
- Updated dependencies [274cb55]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [71b9d02]
- Updated dependencies [47f0afb]
- Updated dependencies [47f0afb]
  - @math-blocks/core@0.1.0
  - @math-blocks/semantic@0.2.0
  - @math-blocks/parser@0.1.0

## 0.0.15

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.
- Updated dependencies [7d29fdc]
- Updated dependencies [5422428]
- Updated dependencies [c9c0185]
  - @math-blocks/core@0.0.13
  - @math-blocks/parser@0.0.15
  - @math-blocks/semantic@0.1.2

## 0.0.14

### Patch Changes

- Updated dependencies [548281d]
- Updated dependencies [778d07d]
- Updated dependencies [0a9084e]
- Updated dependencies [a5e4ccc]
- Updated dependencies [4035999]
  - @math-blocks/semantic@0.1.1
  - @math-blocks/parser@0.0.14

## 0.0.13

### Patch Changes

- 7c4fdbe: Update isEqual to handle comparing tables
- 7c4fdbe: Parse matrices
- 0062515: Make the 'style' property mutable
- 2d0464c: Remove dependency on @math-blocks/testing
- 0062515: Update 'print' function to copy color from semantic nodes
- Updated dependencies [7c4fdbe]
- Updated dependencies [0062515]
  - @math-blocks/semantic@0.1.0
  - @math-blocks/parser@0.0.13
