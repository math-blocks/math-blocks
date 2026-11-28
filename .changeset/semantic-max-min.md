---
'@math-blocks/semantic': patch
---

Add `Max` and `Min` nodes and their builders, `builders.max(args, condition?, loc?)` and `builders.min(args, condition?, loc?)`. `args` holds one or more args: a list such as `max(a, b, c)`, or a single arg such as the set in `max S`. With a `condition`, the node is the maximum or minimum of its one arg over the values that satisfy the condition, e.g. `\max_{x \in S} f(x)` has the arg `f(x)` and the condition `x ∈ S`. `serializer` and `normalize` handle them, and `normalize` sorts their args. Code with an exhaustive `switch` over `Node['type']` needs cases for them.
