---
'@math-blocks/editor': minor
---

`parse` supports the hyperbolic functions `sinh`, `cosh`, `tanh`, `coth`, `sech` and `csch` and their inverses `arsinh`, `arcosh`, `artanh`, `arcoth`, `arsech` and `arcsch`, whether they come from a single char, such as the one `Tex.parse` creates for `\sinh`, or are typed one letter at a time. `\sinh^{-1} x` is `arsinh(x)`, like `\sin^{-1} x` is `arcsin(x)`.

Breaking: because the longest name wins, typed `sinhx` is now `sinh(x)` rather than `sin(h·x)`, and likewise `cosh`, `tanh`, `coth`, `sech` and `csch`. Put a space after the name, as in `sin hx`, to get the old reading. `\sinh x` used to throw `'sinh' isn't supported yet`.
