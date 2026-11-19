---
'@math-blocks/semantic': patch
---

Add `util.isSimplifiedNumber`, which returns true if a node is a number written in simplest form: an integer, a decimal without trailing zeros, or a fraction of integers in lowest terms, optionally negated. For example `2`, `-2.5` and `\frac{5}{2}` are simplified, while `5 \cdot \frac{1}{2}`, `\frac{4}{2}` and `2.0` aren't. Roots and constants such as `\pi` aren't handled yet.
