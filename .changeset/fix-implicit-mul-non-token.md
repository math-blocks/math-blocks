---
'@math-blocks/editor': patch
---

`parse` handles implicit products of two or more operands followed by a fraction, root or parenthesized group, such as `ab\frac{1}{2}`, `2x\sqrt{2}` and `2a(x+1)`, which used to throw `atom expected`. A letter after a fraction or parenthesized group in a product, as in `ab(x)c`, now continues the same product instead of starting a nested one.
