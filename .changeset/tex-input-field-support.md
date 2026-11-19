---
'@math-blocks/tex': minor
'@math-blocks/editor': minor
---

Support the TeX that math input fields produce.

- `@math-blocks/tex`: `parse` supports `\div` and `\ne`, turns bare `(…)` and `|…|` into delimited nodes (the same node `\left(…\right)` produces; an unmatched delimiter stays a plain char), reads `x^-2` as `x^{-2}`, ignores trailing whitespace, and throws on a missing subscript or superscript instead of returning a char with no value.
- `@math-blocks/editor`: `parse` handles `÷` (left associative, same precedence as `×`), `≠`, `π` (as a `Pi` node), greek letters as identifiers, `sin`, `cos`, `tan`, `cot`, `sec`, `csc`, the `arc` functions, `ln` and `log` (with an optional base) as function nodes, `\sin^{-1} x` as `arcsin(x)`, and `|…|` as `AbsoluteValue`. Exponents are now right associative (`x^y^z` is `x^(y^z)`), and empty input throws `Empty input`. Chains of the same relation, e.g. `2x=5=100`, are documented as a single n-ary node.
