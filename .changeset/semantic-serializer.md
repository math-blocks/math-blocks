---
'@math-blocks/semantic': patch
---

Export `serializer`, a jest snapshot serializer that prints semantic nodes as s-expressions. It replaces the `serializer` from the deprecated `@math-blocks/testing` package, so switching is a change of import path: `import { serializer } from '@math-blocks/semantic'`. Unlike the old one, its `test` only matches objects whose `type` is the type of a semantic node, so it no longer claims `null`, primitives or other packages' nodes.
