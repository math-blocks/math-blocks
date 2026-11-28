---
'@math-blocks/react': patch
---

The page's text selection now takes in `MathRenderer`'s math. A selection across text and math highlights each expression it covers, and copying it puts each expression's TeX on the clipboard in its place, in order (e.g. `Solve $x^{2}+1=0$ for x`), with MathML in the HTML. A drag that starts in the math and leaves it for the surrounding text becomes such a selection. The hidden MathML for screen readers is now `user-select: none`, so it's never copied as text such as `x2+1`; what screen readers read is unchanged.
