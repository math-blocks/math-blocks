---
'@math-blocks/editor': patch
---

`parse` supports `max` and `min`, which used to throw `'max' isn't supported yet`. They parse to the new semantic `Max` and `Min` nodes, whether they come from a single char, such as the one `Tex.parse` creates for `\max`, or are typed one letter at a time:

- a list of arguments: `\max(a, b, c)` and `\min(1, x)`. The parens bind tightly, so `\max(a, b)^2` is `(max(a, b))^2`.
- a single argument, such as a set: `\max(S)` or `\max S`. Without parens the argument extends like a function's, so `\max S + 1` is `max(S) + 1`.
- a subscript holding a condition, followed by an expression: `\max_{x \in S} f(x)` and `\min_{0 \le x \le 1} g(x)`. The expression extends like the argument of `\sum`, up to the next `+`, `-`, relation or comma.

`\max` with no argument, `\max()`, `\max_{x}` with no expression, an empty subscript and a superscript on `max` throw. With `requireBackslash` set, typed `max` is still `m·a·x`.
