---
'@math-blocks/tex': patch
---

`parse` supports `\cup`, `\cap`, `\emptyset`, `\ldots`, `\cdots`, `\to`, `\approx`, `\perp`, `\parallel`, `\circ`, and the literal braces `\{` and `\}`, which used to throw `unknown command`. `print` prints `{` and `}` chars as `\{` and `\}`.
