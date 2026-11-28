---
'@math-blocks/editor': minor
---

`parse` handles many more symbols, and names the ones it doesn't support yet.

- New nodes: `∞` (`Infinity`), `∅` (`EmptySet`), `ℕ ℤ ℚ ℝ ℂ` (the number sets), `∈ ∉` (`In`, `NotIn`), `∋ ∌` (`In`, `NotIn` with the arguments swapped), `⊆ ⊂ ⊇ ⊃` (`Subset`, `ProperSubset`, `Superset`, `ProperSuperset`), `∪ ∩` (`Union`, `Intersection`), `…` and `⋯` (`Ellipsis`), `∓` (`MinusPlus`, `UnaryMinusPlus`), sums and products with limits (`Sum`, `Product`), `lim` with a subscript such as `x→0` (`Limit`), `mod` (`Mod`) and `det` (`Determinant`).
- Sums and products are recognized whether the operator is `∑`/`∏`, which `Tex.parse` and the editor create, or the Greek capitals `Σ`/`Π`, and whether the limits are in a limits node or a subsup that follows the operator.
- Breaking: `a ± b` now parses to a `PlusMinus` node instead of an `Add` node that dropped the `±`. In a chain with `+` or `-`, such as `a + b ± c`, the operand after the `±` is wrapped in `UnaryPlusMinus`.
- Breaking: brackets and braces, e.g. `\left[a\right]` or a `[…]` delimited node from the editor, now throw `'[' isn't supported yet` instead of parsing as parentheses.
- Symbols that are valid math but have no semantic node yet throw `'…' isn't supported yet` instead of `Unexpected character '…'`: arrows, `ℍ`, `ℙ`, integrals, `/` (with a hint to use a fraction), `!`, `'`, `%`, `:`, `;`, brackets, braces, `≈`, `⊥`, `∥` and `∘`. Named functions such as `max` throw `'max' isn't supported yet` instead of `Unsupported function 'max'`, and accents throw `'\vec' isn't supported yet`. Other unknown chars still throw `Unexpected character '…' (U+…)`.
