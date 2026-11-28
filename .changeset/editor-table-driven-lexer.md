---
'@math-blocks/editor': minor
---

`parse` lexes chars with a table-driven scanner instead of a regex, which fixes several lexing bugs and recognizes every function name typed one letter at a time.

- New: `parse(input, options?)` takes an optional `ParseOptions` object, and the `ParseOptions` type is exported. With `requireBackslash: true`, only a char that holds a whole name, such as the one `Tex.parse` creates for `\sin`, is a function or operator, and letters typed one at a time are always single-letter identifiers.
- Breaking: by default, every function or operator name the parser knows is recognized when it's typed one letter at a time, not just `sin`, `cos` and `tan`: `cot`, `sec`, `csc`, `arcsin` and the other inverse trig functions, `ln`, `log`, `det`, `mod` and `lim`. The longest name wins and names are case-sensitive, so `arcsinx` is `arcsin(x)` and `SINx` is `S·I·N·x`. Typed `lnx` used to be `l·n·x`.
- Breaking: names without a semantic node yet throw `'max' isn't supported yet` when typed one letter at a time, as they already did for `\max`: `arg`, `min`, `max`, `lcm`, `gcd`, `limsup`, `liminf`, `span`, `rank`, `null`, `adj`, `proj`, `ker` and `dim`. Pass `requireBackslash: true` to lex them as single letters instead.
- Breaking: capital Greek letters such as `Σ` or `Γ`, and other chars that only matched because the regex ignored case (`µ`, `ϑ`, `ϕ`, `ϖ`, `ϰ`, `ϱ`, `ϵ`, `ϐ`), throw `Unexpected character` instead of becoming identifiers. `Σ` and `Π` are still accepted as the operator of a limits node.
- Fix: a number with a second decimal point, such as `1.2.3`, throws `'1.2.3' has more than one decimal point` instead of lexing as `1.2` followed by `.3`.
- Fix: `1...` lexes as `1` followed by an ellipsis instead of throwing on the leftover `..`.
