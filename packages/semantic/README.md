# @math-blocks/semantic

Types describing a semantic AST for representing math expressions and equations.  It
also includes a number of helper functions for constructing nodes.

## Snapshot serializer

`serializer` is a jest snapshot serializer that prints semantic nodes as
s-expressions, e.g. `(Add x (neg.sub 5))`.

```ts
import { serializer } from '@math-blocks/semantic';

expect.addSnapshotSerializer(serializer);
```

It replaces the `serializer` export of the deprecated `@math-blocks/testing`
package.
