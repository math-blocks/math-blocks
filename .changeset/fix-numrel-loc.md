---
'@math-blocks/semantic': patch
---

Fix `builders.numRel` so it keeps its `loc` argument. It used to accept `loc` but leave it off the node it returned.
