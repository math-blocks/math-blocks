// TODO: share these with editor-lexer.js
type Ident = { readonly type: 'identifier'; readonly name: string };
type Num = { readonly type: 'number'; readonly value: string };
type Plus = { readonly type: 'plus' };
type Minus = { readonly type: 'minus' };
type Times = { readonly type: 'times' };
type Slash = { readonly type: 'slash' };
type Eq = { readonly type: 'eq' };
type LessThan = { readonly type: 'lt' };
type GreaterThan = { readonly type: 'gt' };
type Caret = { readonly type: 'caret' };
type Underscore = { readonly type: 'underscore' };
type LParen = { readonly type: 'lparen' };
type RParen = { readonly type: 'rparen' };
type Ellipsis = { readonly type: 'ellipsis' };
type EOL = { readonly type: 'eol' };

export type Token =
  | Ident
  | Num
  | Eq
  | LessThan
  | GreaterThan
  | Plus
  | Minus
  | Times
  | Slash
  | Caret
  | Underscore
  | LParen
  | RParen
  | Ellipsis
  | EOL;

const TOKEN_REGEX =
  /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\+|-|\*|\/|=|<|>|\^|_|\(|\)|\.\.\.)|(sin|cos|tan|[a-z])/gi;

export const identifier = (name: string): Token => ({
  type: 'identifier',
  name,
});
export const number = (value: string): Token => ({ type: 'number', value });

export const eq = (): Token => ({ type: 'eq' });
export const lt = (): Token => ({ type: 'lt' });
export const gt = (): Token => ({ type: 'gt' });
export const plus = (): Token => ({ type: 'plus' });
export const minus = (): Token => ({ type: 'minus' });
export const times = (): Token => ({ type: 'times' });
export const slash = (): Token => ({ type: 'slash' });
export const caret = (): Token => ({ type: 'caret' });
export const underscore = (): Token => ({ type: 'underscore' });
export const lparen = (): Token => ({ type: 'lparen' });
export const rparen = (): Token => ({ type: 'rparen' });
export const ellipsis = (): Token => ({ type: 'ellipsis' });

const stringToToken: {
  readonly [key: string]: () => Token;
} = {
  '=': eq,
  '>': gt,
  '<': lt,
  '+': plus,
  '-': minus,
  '*': times,
  '/': slash,
  '(': lparen,
  ')': rparen,
  '^': caret,
  _: underscore,
  '...': ellipsis,
};

export const lex = (str: string): Token[] => {
  const tokens: Token[] = [];

  const matches = str.matchAll(TOKEN_REGEX);

  for (const match of matches) {
    const [, value, sym, name] = match;
    if (value) {
      tokens.push(number(value));
    } else if (sym) {
      if (sym in stringToToken) {
        tokens.push(stringToToken[sym]());
      } else {
        throw new Error(`Unexpected symbol token: ${sym}`);
      }
    } else if (name) {
      tokens.push(identifier(name));
    }
    // TODO: check if there are leftover characters between token matches
  }

  return tokens;
};
