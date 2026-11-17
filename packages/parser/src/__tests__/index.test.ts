import { parserFactory } from '../index';
import type { IParser, InfixParselet, PrefixParselet } from '../index';

/**
 * A small arithmetic grammar used to exercise the generic Pratt parser.
 *
 * Tokens are single characters: digits, identifiers (a-z), +, -, *, ^, !,
 * '(' and ')'.  Nodes are printed as S-expressions so that the structure of
 * the parse tree is easy to read in assertions.
 */

type TokenType =
  | 'num'
  | 'ident'
  | 'plus'
  | 'minus'
  | 'times'
  | 'caret'
  | 'bang'
  | 'lparen'
  | 'rparen'
  | 'eol';

type Token = { readonly type: TokenType; readonly value: string };

type Node =
  | { readonly kind: 'num'; readonly value: number }
  | { readonly kind: 'ident'; readonly name: string }
  | { readonly kind: 'neg'; readonly arg: Node }
  | { readonly kind: 'fact'; readonly arg: Node }
  | { readonly kind: 'call'; readonly func: Node; readonly arg: Node }
  | {
      readonly kind: 'add' | 'sub' | 'mul' | 'pow';
      readonly left: Node;
      readonly right: Node;
    };

type Operator = 'add' | 'sub' | 'mul' | 'neg' | 'pow' | 'fact' | 'call';

type ToyParser = IParser<Token, Node, Operator>;

const EOL: Token = { type: 'eol', value: '' };

const tokenTypes: Record<string, TokenType> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'times',
  '^': 'caret',
  '!': 'bang',
  '(': 'lparen',
  ')': 'rparen',
};

const lex = (input: string): Token[] =>
  input
    .split('')
    .filter((char) => char !== ' ')
    .map((char): Token => {
      if (/[0-9]/.test(char)) {
        return { type: 'num', value: char };
      } else if (/[a-z]/.test(char)) {
        return { type: 'ident', value: char };
      } else if (char in tokenTypes) {
        return { type: tokenTypes[char], value: char };
      }
      throw new Error(`unknown character: ${char}`);
    });

const getPrefixParselet = (
  token: Token,
): PrefixParselet<Token, Node, Operator> => {
  switch (token.type) {
    case 'num':
      return { parse: () => ({ kind: 'num', value: Number(token.value) }) };
    case 'ident':
      return { parse: () => ({ kind: 'ident', name: token.value }) };
    case 'minus':
      return {
        parse: (parser) => ({
          kind: 'neg',
          arg: parser.parseWithOperator('neg'),
        }),
      };
    case 'lparen':
      return {
        parse: (parser) => {
          const result = parser.parse();
          const next = parser.consume();
          if (next.type !== 'rparen') {
            throw new Error('expected right paren');
          }
          return result;
        },
      };
    default:
      throw new Error(`unexpected '${token.type}' token`);
  }
};

const binary = (
  op: 'add' | 'sub' | 'mul' | 'pow',
  associativity: 'left' | 'right' = 'left',
): InfixParselet<Token, Node, Operator> => ({
  op,
  parse: (parser: ToyParser, left: Node): Node => {
    parser.consume();
    const right = parser.parseWithOperator(op, associativity);
    return { kind: op, left, right };
  },
});

const getInfixParselet = (
  token: Token,
): InfixParselet<Token, Node, Operator> | null => {
  switch (token.type) {
    case 'plus':
      return binary('add');
    case 'minus':
      return binary('sub');
    case 'times':
      return binary('mul');
    case 'caret':
      return binary('pow', 'right');
    case 'bang':
      return {
        op: 'fact',
        parse: (parser, left) => {
          parser.consume();
          return { kind: 'fact', arg: left };
        },
      };
    default:
      return null;
  }
};

const precedence: Record<Operator, number> = {
  add: 1,
  sub: 1,
  mul: 3,
  neg: 5,
  pow: 7,
  fact: 9,
  call: 11,
};

const getOpPrecedence = (op: Operator): number => precedence[op];

const toyParser = parserFactory<Token, Node, Operator>(
  getPrefixParselet,
  getInfixParselet,
  getOpPrecedence,
  EOL,
);

const print = (node: Node): string => {
  switch (node.kind) {
    case 'num':
      return String(node.value);
    case 'ident':
      return node.name;
    case 'neg':
      return `(neg ${print(node.arg)})`;
    case 'fact':
      return `(fact ${print(node.arg)})`;
    case 'call':
      return `(call ${print(node.func)} ${print(node.arg)})`;
    default:
      return `(${node.kind} ${print(node.left)} ${print(node.right)})`;
  }
};

const parse = (input: string): string => print(toyParser.parse(lex(input)));

describe('parserFactory', () => {
  test('returns an object with a parse function', () => {
    expect(typeof toyParser.parse).toBe('function');
  });

  describe('prefix parselets', () => {
    test('a single number', () => {
      expect(toyParser.parse(lex('1'))).toEqual({ kind: 'num', value: 1 });
    });

    test('a single identifier', () => {
      expect(toyParser.parse(lex('x'))).toEqual({ kind: 'ident', name: 'x' });
    });

    test('negation', () => {
      expect(parse('-x')).toBe('(neg x)');
    });

    test('nested negation', () => {
      expect(parse('--x')).toBe('(neg (neg x))');
    });
  });

  describe('infix parselets', () => {
    test('a single binary operator', () => {
      expect(parse('1 + 2')).toBe('(add 1 2)');
    });

    test('postfix operators', () => {
      expect(parse('3!')).toBe('(fact 3)');
      expect(parse('3!!')).toBe('(fact (fact 3))');
    });
  });

  describe('precedence', () => {
    test('higher precedence operators bind more tightly on the right', () => {
      expect(parse('1 + 2 * 3')).toBe('(add 1 (mul 2 3))');
    });

    test('higher precedence operators bind more tightly on the left', () => {
      expect(parse('1 * 2 + 3')).toBe('(add (mul 1 2) 3)');
    });

    test('mixed precedence levels', () => {
      expect(parse('1 + 2 * 3 ^ 4 - 5')).toBe(
        '(sub (add 1 (mul 2 (pow 3 4))) 5)',
      );
    });

    test('a prefix operator parsed with parseWithOperator binds tighter than mul', () => {
      expect(parse('-a * b')).toBe('(mul (neg a) b)');
    });

    test('a prefix operator binds looser than exponentiation', () => {
      expect(parse('-a ^ b')).toBe('(neg (pow a b))');
    });

    test('postfix operators bind tighter than everything else', () => {
      expect(parse('-a ^ b!')).toBe('(neg (pow a (fact b)))');
      expect(parse('a! ^ b')).toBe('(pow (fact a) b)');
    });

    test('parentheses override precedence', () => {
      expect(parse('(1 + 2) * 3')).toBe('(mul (add 1 2) 3)');
      expect(parse('-(a + b)')).toBe('(neg (add a b))');
    });

    test('nested parentheses', () => {
      expect(parse('((1))')).toBe('1');
      expect(parse('2 * (3 * (4 + 5))')).toBe('(mul 2 (mul 3 (add 4 5)))');
    });
  });

  describe('associativity', () => {
    test('left associative operators group to the left', () => {
      expect(parse('1 - 2 - 3')).toBe('(sub (sub 1 2) 3)');
      expect(parse('1 + 2 - 3 + 4')).toBe('(add (sub (add 1 2) 3) 4)');
      expect(parse('a * b * c')).toBe('(mul (mul a b) c)');
    });

    test('right associative operators group to the right', () => {
      expect(parse('a ^ b ^ c')).toBe('(pow a (pow b c))');
      expect(parse('a ^ b ^ c ^ d')).toBe('(pow a (pow b (pow c d)))');
    });

    test('a right associative operator stops at a lower precedence operator', () => {
      expect(parse('a ^ b * c')).toBe('(mul (pow a b) c)');
      expect(parse('a ^ b ^ c + d')).toBe('(add (pow a (pow b c)) d)');
    });
  });

  describe('parser interface', () => {
    test('peek returns the next token without consuming it', () => {
      const seen: Token[] = [];
      const peekingParser = parserFactory<Token, Node, Operator>(
        (token) =>
          token.type === 'lparen'
            ? {
                parse: (parser) => {
                  seen.push(parser.peek());
                  seen.push(parser.peek());
                  const result = parser.parse();
                  parser.consume();
                  return result;
                },
              }
            : getPrefixParselet(token),
        getInfixParselet,
        getOpPrecedence,
        EOL,
      );

      const result = peekingParser.parse(lex('(x)'));

      expect(result).toEqual({ kind: 'ident', name: 'x' });
      expect(seen).toEqual([
        { type: 'ident', value: 'x' },
        { type: 'ident', value: 'x' },
      ]);
    });

    test('peek and consume return EOL once the tokens run out', () => {
      const seen: Token[] = [];
      const eolParser = parserFactory<Token, Node, Operator>(
        (token) => ({
          parse: (parser) => {
            seen.push(parser.peek());
            seen.push(parser.consume());
            seen.push(parser.consume());
            return getPrefixParselet(token).parse(parser);
          },
        }),
        getInfixParselet,
        getOpPrecedence,
        EOL,
      );

      eolParser.parse(lex('x'));

      expect(seen).toEqual([EOL, EOL, EOL]);
    });

    test('infix parselets receive the parsed left operand', () => {
      const lefts: Node[] = [];
      const recordingParser = parserFactory<Token, Node, Operator>(
        getPrefixParselet,
        (token) => {
          const parselet = getInfixParselet(token);
          if (!parselet) {
            return null;
          }
          return {
            op: parselet.op,
            parse: (parser, left) => {
              lefts.push(left);
              return parselet.parse(parser, left);
            },
          };
        },
        getOpPrecedence,
        EOL,
      );

      recordingParser.parse(lex('1 * 2 + 3'));

      expect(lefts.map(print)).toEqual(['1', '(mul 1 2)']);
    });

    test('infix parselets can call parse to read a full sub-expression', () => {
      // Treat '(' after an operand as a function call, e.g. f(x + 1).
      const callParselet: InfixParselet<Token, Node, Operator> = {
        op: 'call',
        parse: (parser, left) => {
          parser.consume(); // '('
          const arg = parser.parse();
          if (parser.consume().type !== 'rparen') {
            throw new Error('expected right paren');
          }
          return { kind: 'call', func: left, arg };
        },
      };
      const callParser = parserFactory<Token, Node, Operator>(
        getPrefixParselet,
        (token) =>
          token.type === 'lparen' ? callParselet : getInfixParselet(token),
        getOpPrecedence,
        EOL,
      );
      const parseCall = (input: string): string =>
        print(callParser.parse(lex(input)));

      expect(parseCall('f(x + 1)')).toBe('(call f (add x 1))');
      expect(parseCall('2 * f(g(a ^ b))')).toBe(
        '(mul 2 (call f (call g (pow a b))))',
      );
      expect(() => parseCall('f(x')).toThrow('expected right paren');
    });

    test('parsers can be reused for several inputs', () => {
      expect(parse('1 + 2')).toBe('(add 1 2)');
      expect(parse('3 * 4')).toBe('(mul 3 4)');
    });
  });

  describe('errors', () => {
    test('throws on an unmatched right paren', () => {
      expect(() => parse('1 + 2)')).toThrow('unmatched right paren');
      expect(() => parse('(1))')).toThrow('unmatched right paren');
    });

    test('throws on a token that is not consumed by the grammar', () => {
      expect(() => parse('1 2')).toThrow('unexpected token');
      expect(() => parse('a (b)')).toThrow('unexpected token');
    });

    test('errors from prefix parselets propagate', () => {
      expect(() => parse('(1 + 2')).toThrow('expected right paren');
      expect(() => parse('* 2')).toThrow("unexpected 'times' token");
    });

    test('passes EOL to the prefix parselet when there are no tokens', () => {
      expect(() => toyParser.parse([])).toThrow("unexpected 'eol' token");
    });

    test('passes EOL to the prefix parselet when an operand is missing', () => {
      expect(() => parse('1 +')).toThrow("unexpected 'eol' token");
    });
  });
});
