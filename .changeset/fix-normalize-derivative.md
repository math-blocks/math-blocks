---
'@math-blocks/semantic': patch
---

Fix `util.normalize` for `Derivative` nodes. It printed the degree as `[object Object]` and left out the variable, so derivatives with different degrees or variables normalized to the same string. It now prints `(Derivative <arg> :bvar <bvar> :degree <degree>)`.
