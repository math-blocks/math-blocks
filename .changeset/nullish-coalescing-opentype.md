---
'@math-blocks/opentype': patch
---

Lint fix from `prefer-nullish-coalescing`: the CFF table parser creates its shared `TextDecoder` with `??=`. No change in behavior.
