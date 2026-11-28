---
'@math-blocks/semantic': patch
---

Add nodes and builders for the hyperbolic functions and their inverses: `Sinh`, `Cosh`, `Tanh`, `Coth`, `Sech`, `Csch` and `ArcSinh`, `ArcCosh`, `ArcTanh`, `ArcCoth`, `ArcSech`, `ArcCsch` (`builders.sinh` … `builders.arccsch`). They have the same shape as the trig nodes, and `serializer` and `normalize` handle them. Code with an exhaustive `switch` over `Node['type']` needs cases for them.
