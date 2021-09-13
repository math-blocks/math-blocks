# @math-blocks/parser

`parserFactory` can be used to generate TDOP/Pratt parsers.  The reason for using
this style of parsing is that it's much easier to change the precedence and add
new operators that it would be other parser types.

```typescript
function parserFactory<T extends {readonly type: string}, N, O>(
    getPrefixParselet: (token: T) => PrefixParselet<T, N, O>,
    getInfixParselet: (token: T) => InfixParselet<T, N, O> | null,
    getOpPrecedence: (arg0: O) => number,
    EOL: T,
): {parse: (arg0: Array<T>) => N}
```

The three generic properties are:
- `T`: token object type produced by a lexer
- `N`: node object type that the parser will produce
- `O`: operator type (usually an enum of union of strings)

`getPrefixParselet` and `getInfixParselet` are functions that return the parselet
that should be used for the given `token`.  Parselets are objects that contain
a `parse` method and possible additional data.  Infix parselets also keep track
of the current operator.

In the future, support for post-fix operators such as `!` and `'` will be added.

## Examples

- @math-blocks/editor-parser/src/editor-parser.ts
- @math-blocks/testing/src/text-parser.ts
