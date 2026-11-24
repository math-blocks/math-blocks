---
'@math-blocks/editor': patch
---

Lint fixes from `prefer-nullish-coalescing`: the `subsup` reducer and the token builders use `??` instead of `||` for object fallbacks. No change in behavior.
