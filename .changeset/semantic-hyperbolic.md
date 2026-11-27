---
'@math-blocks/semantic': patch
---

Add nodes and builders for the hyperbolic functions and their inverses: `Sinh`, `Cosh`, `Tanh`, `Coth`, `Sech`, `Csch` and `ArSinh`, `ArCosh`, `ArTanh`, `ArCoth`, `ArSech`, `ArCsch` (`builders.sinh` … `builders.arcsch`). They have the same shape as the trig nodes, and `serializer` and `normalize` handle them. Code with an exhaustive `switch` over `Node['type']` needs cases for them.
