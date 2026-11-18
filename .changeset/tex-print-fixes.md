---
'@math-blocks/tex': patch
'@math-blocks/editor': patch
---

Fix printing semantic trees to TeX with `Tex.print(Editor.print(node))`.

- `@math-blocks/tex`: `print` puts a space between a command name and a letter that follows it, so `x>y` prints as `x\gt y` instead of `x\gty` and `2πr` as `2\pi r`.
- `@math-blocks/editor`: `print` handles `Pi`, `Root` (`\sqrt{…}` and `\sqrt[n]{…}`), `AbsoluteValue` (`\left|…\right|`) and `NotEquals` nodes instead of throwing.
