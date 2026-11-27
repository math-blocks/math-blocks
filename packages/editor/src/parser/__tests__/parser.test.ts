import * as Semantic from '@math-blocks/semantic';
import { NodeType, serializer } from '@math-blocks/semantic';

import * as builders from '../../char/builders';
import * as util from '../../char/util';
import type * as types from '../../char/types';
import { AccentType } from '../../shared-types';

import * as parser from '../parser';

const { row, char, subsup, limits } = builders;

expect.addSnapshotSerializer(serializer);

describe('EditorParser', () => {
  it('should handle equations', () => {
    const input = util.row('2x=10');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Equals
              (mul.imp 2 x)
              10)
        `);

    expect(ast.loc).toEqual({
      start: 0,
      end: 5,
      path: [],
    });
    if (ast.type === NodeType.Equals) {
      expect(ast.args[0].loc).toEqual({
        start: 0,
        end: 2,
        path: [],
      });
      expect(ast.args[1].loc).toEqual({
        start: 3,
        end: 5,
        path: [],
      });
    }
  });

  it('should handle deep nesting in expressions', () => {
    const input = builders.row([
      char('1'),
      char('+'),
      builders.delimited(
        [
          char('2'),
          char('+'),
          builders.delimited(
            [
              char('3'),
              char('+'),
              builders.delimited(
                [char('4'), char('+'), char('5')],
                char('('),
                char(')'),
              ),
            ],
            char('('),
            char(')'),
          ),
        ],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
      (Add
        1
        (Add
          2
          (Add
            3
            (Add 4 5))))
    `);
  });

  it('should handle less than', () => {
    const input = util.row('2x<10');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
      (LessThan
        (mul.imp 2 x)
        10)
    `);
  });

  it('should handle greater than', () => {
    const input = util.row('2x>10');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
      (GreaterThan
        (mul.imp 2 x)
        10)
    `);
  });

  it('should handle n-ary equality', () => {
    const input = util.row('x=y=z');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(Equals x y z)`);
  });

  it('should handle n-ary less than', () => {
    const input = util.row('x<y<z');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(LessThan x y z)`);
  });

  it('should handle n-ary greater than', () => {
    const input = util.row('2x>10');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
      (GreaterThan
        (mul.imp 2 x)
        10)
    `);
  });

  it('should parse binary expressions containing subtraction', () => {
    const input = util.row('1-2');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              (neg.sub 2))
        `);
  });

  it('should parse n-ary expressions containing subtraction', () => {
    const input = util.row('1-2-3');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              (neg.sub 2)
              (neg.sub 3))
        `);
  });

  it('should handle subtracting negative numbers', () => {
    const input = util.row('1--2');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              (neg.sub (neg 2)))
        `);
  });

  it('should parse an ASCII hyphen-minus as subtraction', () => {
    // util.row() converts '-' to '\u2212' so we build the row by hand.
    const input = row([char('a'), char('-'), char('b')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
      (Add
        a
        (neg.sub b))
    `);
  });

  it('should parse an ASCII hyphen-minus as negation', () => {
    const input = row([char('-'), char('3'), char('x')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(neg (mul.imp 3 x))`);
  });

  it('should throw on a char it does not recognize', () => {
    expect(() =>
      parser.parse(util.row('a?b')),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unexpected character '?' (U+003F)]`,
    );
  });

  it('should throw on an unrecognized char at the end of a row', () => {
    expect(() =>
      parser.parse(util.row('ab$')),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unexpected character '$' (U+0024)]`,
    );
  });

  it('should throw on an unrecognized char inside a fraction', () => {
    const input = row([builders.frac([char('1')], [char('#')])]);
    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unexpected character '#' (U+0023)]`,
    );
  });

  it('should ignore whitespace between tokens', () => {
    const ast = parser.parse(util.row('2 x = 10'));

    expect(ast).toMatchInlineSnapshot(`
      (Equals
        (mul.imp 2 x)
        10)
    `);
  });

  it('should parse expressions containing unary minus', () => {
    const input = util.row('1+-2+3');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              (neg 2)
              3)
        `);
  });

  it('should parse explicit multiplication', () => {
    const input = util.row('1*2');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2)`);
  });

  it('should parse n-ary explicit multiplication', () => {
    const input = util.row('1*2*3');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
  });

  it('should parse implicit multiplication', () => {
    const input = util.row('abc');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
  });

  it('should handle fractions', () => {
    const input = row([char('1'), char('+'), util.frac('1', 'x')]);

    const parseTree = parser.parse(input);

    expect(parseTree).toMatchInlineSnapshot(`
            (Add
              1
              (Div 1 x))
        `);
    expect(parseTree.loc).toEqual({
      start: 0,
      end: 3,
      path: [],
    });
    if (parseTree.type === NodeType.Add) {
      expect(parseTree.args[1].loc).toEqual({
        start: 2,
        end: 3,
        path: [],
      });
      if (parseTree.args[1].type === NodeType.Div) {
        // numerator
        expect(parseTree.args[1].args[0].loc).toEqual({
          start: 0,
          end: 1,
          path: [2, 0],
        });
        // denominator
        expect(parseTree.args[1].args[1].loc).toEqual({
          start: 0,
          end: 1,
          path: [2, 1],
        });
      }
    }
  });

  it('should handle exponents', () => {
    const input = row([char('x'), util.sup('2')]);

    const parseTree = parser.parse(input);

    expect(parseTree).toMatchInlineSnapshot(`(Power :base x :exp 2)`);
    expect(parseTree.loc).toEqual({
      start: 0,
      end: 2,
      path: [],
    });
    if (parseTree.type === NodeType.Power) {
      expect(parseTree.exp.loc).toEqual({
        start: 0,
        end: 1,
        path: [1, 1],
      });
    }
  });

  it('should handle nested exponents', () => {
    const input = row([
      char('x'),
      subsup(undefined, [char('y'), util.sup('2')]),
    ]);

    const parseTree = parser.parse(input);

    expect(parseTree).toMatchInlineSnapshot(`
            (Power
              :base x
              :exp (Power :base y :exp 2))
        `);
  });

  it('should handle subscripts on identifiers', () => {
    const input = row([char('a'), util.sub('n+1')]);

    const parseTree = parser.parse(input);

    expect(parseTree).toMatchInlineSnapshot(`(ident a (Add n 1))`);

    expect(parseTree.loc).toEqual({
      start: 0,
      end: 1,
      path: [],
    });
    if (parseTree.type === NodeType.Identifier) {
      if (parseTree.subscript) {
        expect(parseTree.subscript.loc).toEqual({
          start: 0,
          end: 3, // n + 1
          path: [1, 0],
        });
      }
    }
  });

  it('should handle subscripts and superscripts identifiers', () => {
    const input = row([char('a'), util.subsup('n+1', '2')]);

    const parseTree = parser.parse(input);

    expect(parseTree).toMatchInlineSnapshot(
      `(Power :base (ident a (Add n 1)) :exp 2)`,
    );
  });

  it('should throw when a subscript is being used on a number', () => {
    const input = row([char('2'), util.sub('0')]);

    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `[Error: subscripts are only allowed on identifiers]`,
    );
  });

  it('should throw when an atom is expected', () => {
    const input = util.row('2-');

    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unexpected 'EOL' atom]`,
    );
  });

  it("should throw on a trailing '+'", () => {
    const input = util.row('2+2+');

    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unexpected 'EOL' atom]`,
    );
  });

  it('should handle an ellispis', () => {
    const input = util.row('1+...+n');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              ...
              n)
        `);

    expect(ast.loc).toEqual({
      path: [],
      start: 0,
      end: 7,
    });
  });

  it('should handle adding with parens', () => {
    const input = builders.row([
      char('a'),
      char('+'),
      builders.delimited(
        [char('b'), char('+'), char('c')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (Add
              a
              (Add b c))
        `);
  });

  it('negation is lower precedence than implicit multiplication', () => {
    const input = util.row('-ab');

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(neg (mul.imp a b))`);
  });

  it('single paren expression', () => {
    // (a+b)
    const input = builders.row([
      builders.delimited(
        [char('a'), char('+'), char('b')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(Parens (Add a b))`);
  });

  it('negation can be on individual factors when wrapped in parens', () => {
    // (-a)(b)
    const input = builders.row([
      builders.delimited([char('\u2212'), char('a')], char('('), char(')')),
      builders.delimited([char('b')], char('('), char(')')),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg a)
              b)
        `);
  });

  it('muliplication with more than two parens', () => {
    // (-a)(b)
    const input = builders.row([
      builders.delimited([char('a')], char('('), char(')')),
      builders.delimited([char('b')], char('('), char(')')),
      builders.delimited([char('c')], char('('), char(')')),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
  });

  it('should handle implicit multiplication with parens', () => {
    const input = builders.row([
      char('a'),
      builders.delimited(
        [char('b'), char('+'), char('c')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (Add b c))
        `);
  });

  it('should handle implicit multiplication with multiple parens', () => {
    const input = builders.row([
      char('a'),
      builders.delimited(
        [char('b'), char('+'), char('c')],
        char('('),
        char(')'),
      ),
      builders.delimited(
        [char('d'), char('+'), char('e')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (Add b c)
              (Add d e))
        `);
  });

  it('should handle implicit multiplication with parens at the start', () => {
    const input = builders.row([
      builders.delimited(
        [char('b'), char('+'), char('c')],
        char('('),
        char(')'),
      ),
      builders.delimited(
        [char('d'), char('+'), char('e')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Add b c)
              (Add d e))
        `);
  });

  it('should handle implicit multiplication by a number at the end', () => {
    const input = builders.row([
      builders.delimited([char('b')], char('('), char(')')),
      char('2'),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`(mul.imp b 2)`);
  });

  it('should handle implicit multiplication by a frac at the end', () => {
    const input = builders.row([
      builders.delimited(
        [char('a'), char('+'), char('b')],
        char('('),
        char(')'),
      ),
      util.frac('1', '2'),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Add a b)
              (Div 1 2))
        `);
  });

  it('should handle implicit multiplication by a frac at the start', () => {
    const input = row([util.frac('1', '2'), char('b')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Div 1 2)
              b)
        `);
  });

  it('should error on two fractions in a row without an operator', () => {
    const input = row([util.frac('1', '2'), util.frac('1', '2')]);

    expect(() => parser.parse(input)).toThrowError(
      'An operator is required between fractions',
    );
  });

  it('should handle implicit multiplication with roots', () => {
    const input = row([char('a'), util.root('b', '2')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (Root :radicand 2 :index b))
        `);

    expect(ast.loc).toEqual({
      start: 0,
      end: 2,
      path: [],
    });
    if (ast.type === NodeType.Mul) {
      expect(ast.args[0].loc).toEqual({
        start: 0,
        end: 1,
        path: [],
      });
      expect(ast.args[1].loc).toEqual({
        start: 1,
        end: 2,
        path: [],
      });
      if (ast.args[1].type === NodeType.Root) {
        expect(ast.args[1].radicand.loc).toEqual({
          start: 0,
          end: 1,
          path: [1, 0],
        });
        expect(ast.args[1].index.loc).toEqual({
          start: 0,
          end: 1,
          path: [1, 1],
        });
      }
    }
  });

  it('should handle implicit multiplication with multiple roots', () => {
    const input = row([char('a'), util.root('b', '2'), util.root('c', '3')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (Root :radicand 2 :index b)
              (Root :radicand 3 :index c))
        `);
  });

  it('should handle implicit multiplication starting with a root', () => {
    const input = row([util.root('b', '2'), util.root('c', '3')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Root :radicand 2 :index b)
              (Root :radicand 3 :index c))
        `);
  });

  it('should handle (√2)a', () => {
    const input = row([util.root('2', '2'), char('a')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Root :radicand 2 :index 2)
              a)
        `);
  });

  it('should handle 5√2', () => {
    const input = row([char('5'), util.root('2', '2')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              5
              (Root :radicand 2 :index 2))
        `);
  });

  it('should handle √2 5', () => {
    const input = row([util.root('2', '2'), char('5')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Root :radicand 2 :index 2)
              5)
        `);
  });

  it('should handle √2√3', () => {
    const input = row([util.root('2', '2'), util.root('3', '2')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Root :radicand 2 :index 2)
              (Root :radicand 2 :index 3))
        `);
  });

  it('should handle √2 a', () => {
    const input = row([util.root('2', '2'), char('a')]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Root :radicand 2 :index 2)
              a)
        `);
  });

  it('-1(a + b)', () => {
    const input = builders.row([
      char('\u2212'),
      char('1'),
      builders.delimited(
        [char('a'), char('+'), char('b')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (neg (mul.imp
              1
              (Add a b)))
        `);
  });

  it('(-1)(a + b)', () => {
    const input = builders.row([
      builders.delimited([char('\u2212'), char('1')], char('('), char(')')),
      builders.delimited(
        [char('a'), char('+'), char('b')],
        char('('),
        char(')'),
      ),
    ]);

    const ast = parser.parse(input);

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg 1)
              (Add a b))
        `);
  });

  describe('excess parens', () => {
    it('(x)', () => {
      const input = builders.row([
        builders.delimited([char('x')], char('('), char(')')),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`(Parens x)`);
    });

    it('((x))', () => {
      const input = builders.row([
        builders.delimited(
          [builders.delimited([char('x')], char('('), char(')'))],
          char('('),
          char(')'),
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`(Parens (Parens x))`);
    });

    it('1 + (x)', () => {
      const input = builders.row([
        char('1'),
        char('+'),
        builders.delimited([char('x')], char('('), char(')')),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  1
                  (Parens x))
            `);
    });

    it('2((x + y))', () => {
      const input = builders.row([
        char('2'),
        builders.delimited(
          [
            builders.delimited(
              [char('x'), char('+'), char('y')],
              char('('),
              char(')'),
            ),
          ],
          char('('),
          char(')'),
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
                (mul.imp
                  2
                  (Parens (Add x y)))
            `);
    });

    it('1 + (xy)', () => {
      const input = builders.row([
        char('1'),
        char('+'),
        builders.delimited([char('x'), char('y')], char('('), char(')')),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  1
                  (Parens (mul.imp x y)))
            `);
    });

    it('a + (-b)', () => {
      const input = builders.row([
        char('a'),
        char('+'),
        builders.delimited([char('\u2212'), char('b')], char('('), char(')')),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  a
                  (Parens (neg b)))
            `);
    });

    it('(-1)(a) + (-1)(b)', () => {
      const input = builders.row([
        builders.delimited([char('\u2212'), char('a')], char('('), char(')')),
        char('+'),
        builders.delimited([char('\u2212'), char('b')], char('('), char(')')),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  (Parens (neg a))
                  (Parens (neg b)))
            `);
    });
  });

  describe('numeric relations', () => {
    it('should parse equals', () => {
      const input = builders.row([char('x'), char('='), char('y')]);
      expect(parser.parse(input)).toMatchInlineSnapshot(`(Equals x y)`);
    });

    it('should parse less than', () => {
      const input = builders.row([char('x'), char('<'), char('y')]);
      expect(parser.parse(input)).toMatchInlineSnapshot(`(LessThan x y)`);
    });

    it('should parse less than or equals', () => {
      const input = builders.row([char('x'), char('≤'), char('y')]);
      expect(parser.parse(input)).toMatchInlineSnapshot(
        `(LessThanOrEquals x y)`,
      );
    });

    it('should parse greater than', () => {
      const input = builders.row([char('x'), char('>'), char('y')]);
      expect(parser.parse(input)).toMatchInlineSnapshot(`(GreaterThan x y)`);
    });

    it('should parse greater than or equals', () => {
      const input = builders.row([char('x'), char('≥'), char('y')]);
      expect(parser.parse(input)).toMatchInlineSnapshot(
        `(GreaterThanOrEquals x y)`,
      );
    });
  });

  describe('sequences', () => {
    test('1, 2, 3', () => {
      const input = builders.row([
        char('1'),
        char(','),
        char('2'),
        char(','),
        char('3'),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`(Sequence 1 2 3)`);
    });

    test('x = 1, y = 2', () => {
      const input = builders.row([
        char('x'),
        char('='),
        char('1'),
        char(','),
        char('y'),
        char('='),
        char('2'),
      ]);

      const ast = parser.parse(input);

      expect(ast).toMatchInlineSnapshot(`
        (Sequence
          (Equals x 1)
          (Equals y 2))
      `);
    });
  });

  describe('linear algebra', () => {
    test('matrix', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('1')]),
            builders.row([builders.char('2')]),
            builders.row([builders.char('3')]),
            builders.row([builders.char('4')]),
          ],
          2,
          2,
        ),
      ]);

      const ast = parser.parse(row);

      expect(ast).toMatchInlineSnapshot(`(Matrix 1 2 3 4)`);
    });

    test('matrix with empty cells', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('1')]),
            builders.row([builders.char('2')]),
            builders.row([builders.char('3')]),
            builders.row([]),
          ],
          2,
          2,
        ),
      ]);

      expect(() => parser.parse(row)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Unexpected 'EOL' atom]`,
      );
    });

    test('matrix with null cels', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('1')]),
            builders.row([builders.char('2')]),
            builders.row([builders.char('3')]),
            null,
          ],
          2,
          2,
        ),
      ]);

      expect(() => parser.parse(row)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Matrix cells must be non-null]`,
      );
    });
  });

  describe('division with ÷', () => {
    test('a÷b÷c is left associative', () => {
      expect(parser.parse(util.row('a÷b÷c'))).toMatchInlineSnapshot(`
        (Div
          (Div a b)
          c)
      `);
    });
  });

  describe('not equals', () => {
    test('x≠5', () => {
      expect(parser.parse(util.row('x≠5'))).toMatchInlineSnapshot(
        `(NotEquals x 5)`,
      );
    });
  });

  describe('pi and greek letters', () => {
    test('2πr', () => {
      expect(parser.parse(util.row('2πr'))).toMatchInlineSnapshot(`
        (mul.imp
          2
          π
          r)
      `);
    });

    test('θ is an identifier', () => {
      expect(parser.parse(util.row('θ'))).toMatchInlineSnapshot(`θ`);
    });
  });

  describe('functions', () => {
    test('a function typed one letter at a time', () => {
      expect(parser.parse(util.row('sinx'))).toMatchInlineSnapshot(`(Sin x)`);
    });

    test('a trig function typed one letter at a time', () => {
      expect(parser.parse(util.row('cotx'))).toMatchInlineSnapshot(`(Cot x)`);
    });

    test('ln typed one letter at a time', () => {
      expect(parser.parse(util.row('lnx'))).toMatchInlineSnapshot(`(Ln x)`);
    });

    test('log typed one letter at a time', () => {
      expect(parser.parse(util.row('logx'))).toMatchInlineSnapshot(`(Log x)`);
    });

    test('the longest name wins', () => {
      // Not a·r·c·sin(x).
      expect(parser.parse(util.row('arcsinx'))).toMatchInlineSnapshot(
        `(ArcSin x)`,
      );
    });

    test('mod typed one letter at a time', () => {
      expect(parser.parse(util.row('amodn'))).toMatchInlineSnapshot(
        `(Modulo a n)`,
      );
    });

    test('names are case-sensitive', () => {
      expect(parser.parse(util.row('SINx'))).toMatchInlineSnapshot(
        `(mul.imp S I N x)`,
      );
    });

    test('an unsupported name typed one letter at a time throws', () => {
      expect(() => parser.parse(util.row('maxx'))).toThrow(
        "'max' isn't supported yet",
      );
    });

    test('requireBackslash makes typed letters single identifiers', () => {
      const options = { requireBackslash: true };
      expect(parser.parse(util.row('sinx'), options)).toMatchInlineSnapshot(
        `(mul.imp s i n x)`,
      );
      expect(parser.parse(util.row('maxx'), options)).toMatchInlineSnapshot(
        `(mul.imp m a x x)`,
      );
      expect(
        parser.parse(row([char('sin'), char('x')]), options),
      ).toMatchInlineSnapshot(`(Sin x)`);
    });

    test('a function stored in a single char', () => {
      const input = row([char('ln'), char('x')]);
      const ast = parser.parse(input);
      expect(ast).toMatchInlineSnapshot(`(Ln x)`);
      expect(ast.loc).toEqual({ path: [], start: 0, end: 2 });
    });

    test('an unknown multi-letter char throws', () => {
      const input = row([char('gcd'), char('x')]);
      expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
        `[Error: 'gcd' isn't supported yet]`,
      );
    });
  });

  describe('absolute value', () => {
    test('|x|', () => {
      const input = row([
        builders.delimited([char('x')], char('|'), char('|')),
      ]);
      expect(parser.parse(input)).toMatchInlineSnapshot(`(AbsoluteValue x)`);
    });
  });

  describe('exponents', () => {
    test('consecutive superscripts are right associative', () => {
      const input = row([
        char('x'),
        subsup(undefined, [char('y')]),
        subsup(undefined, [char('z')]),
      ]);
      const ast = parser.parse(input);
      expect(ast).toMatchInlineSnapshot(`
        (Power
          :base x
          :exp (Power :base y :exp z))
      `);
      expect(ast.loc).toEqual({ path: [], start: 0, end: 3 });
    });
  });

  describe('empty input', () => {
    test('throws "Empty input"', () => {
      expect(() => parser.parse(row([]))).toThrowErrorMatchingInlineSnapshot(
        `[Error: Empty input]`,
      );
      expect(() =>
        parser.parse(util.row('  ')),
      ).toThrowErrorMatchingInlineSnapshot(`[Error: Empty input]`);
    });
  });

  describe('symbols', () => {
    const b = Semantic.builders;
    const x = b.identifier('x');
    const y = b.identifier('y');
    const i = b.identifier('i');
    const n = b.identifier('n');
    const A = b.identifier('A');
    const B = b.identifier('B');
    const C = b.identifier('C');
    const num = (value: string): Semantic.types.Node => b.number(value);

    // Removes `id` and `loc` so that trees can be compared with `toEqual`.
    const strip = (node: Semantic.types.Node): unknown =>
      JSON.parse(
        JSON.stringify(node, (key, value) =>
          key === 'id' || key === 'loc' ? undefined : value,
        ),
      );

    describe('constants', () => {
      test.each([
        ['∞', b.infinity()],
        ['∅', b.emptyset()],
        ['ℕ', b.naturals()],
        ['ℤ', b.integers()],
        ['ℚ', b.rationals()],
        ['ℝ', b.reals()],
        ['ℂ', b.complexes()],
        ['2∞', b.mul([num('2'), b.infinity()], true)],
        ['-∞', b.neg(b.infinity())],
        ['x<∞', b.lt([x, b.infinity()])],
      ])('%s', (input, expected) => {
        expect(strip(parser.parse(util.row(input)))).toEqual(strip(expected));
      });
    });

    describe('± and ∓', () => {
      test.each([
        ['x±y', b.plusminus([x, y])],
        ['x∓y', b.minusplus([x, y])],
        ['x±y±n', b.plusminus([x, y, n])],
        ['±x', b.unaryplusminus(x)],
        ['∓x', b.unaryminusplus(x)],
        // In a chain with other operators, each operand after a `±` or
        // `∓` is wrapped, like each subtracted operand is wrapped in Neg.
        ['x+y±n', b.add([x, y, b.unaryplusminus(n)])],
        ['x∓y-n', b.add([x, b.unaryminusplus(y), b.neg(n, true)])],
      ])('%s', (input, expected) => {
        expect(strip(parser.parse(util.row(input)))).toEqual(strip(expected));
      });
    });

    describe('sets', () => {
      test.each([
        ['x∈A', b.in(x, A)],
        ['x∉A', b.notin(x, A)],
        // `∋` and `∌` are `∈` and `∉` with the arguments swapped.
        ['A∋x', b.in(x, A)],
        ['A∌x', b.notin(x, A)],
        ['x∈ℝ', b.in(x, b.reals())],
        // `⊆` allows equal sets and `⊂` doesn't, as in OpenMath's set1
        // content dictionary: `subset` and `prsubset`.
        ['A⊆B', b.subset([A, B])],
        ['A⊂B', b.propersubset([A, B])],
        ['A⊇B', b.superset([A, B])],
        ['A⊃B', b.propersuperset([A, B])],
        ['A⊆B⊆C', b.subset([A, B, C])],
        ['A∪B', b.union([A, B])],
        ['A∩B', b.intersection([A, B])],
        ['A∪B∪C', b.union([A, B, C])],
        // Intersection binds more tightly than union.
        ['A∪B∩C', b.union([A, b.intersection([B, C])])],
        ['A∩B∪C', b.union([b.intersection([A, B]), C])],
        ['x∈A∪B', b.in(x, b.union([A, B]))],
        ['A∩B=∅', b.eq([b.intersection([A, B]), b.emptyset()])],
        ['x∈A,y∈B', b.sequence([b.in(x, A), b.in(y, B)])],
      ])('%s', (input, expected) => {
        expect(strip(parser.parse(util.row(input)))).toEqual(strip(expected));
      });
    });

    describe('ellipses', () => {
      test.each([
        ['1+…+n', b.add([num('1'), b.ellipsis(), n])],
        ['1+⋯+n', b.add([num('1'), b.ellipsis(), n])],
        ['1,2,…,n', b.sequence([num('1'), num('2'), b.ellipsis(), n])],
      ])('%s', (input, expected) => {
        expect(strip(parser.parse(util.row(input)))).toEqual(strip(expected));
      });
    });

    describe('sums and products', () => {
      const lower = [char('i'), char('='), char('1')];
      const upper = [char('n')];
      test.each([
        [
          'a limits node around ∑',
          [limits(char('∑'), lower, upper), char('i')],
          b.sum(i, i, num('1'), n),
        ],
        [
          'a limits node around Σ',
          [limits(char('Σ'), lower, upper), char('i')],
          b.sum(i, i, num('1'), n),
        ],
        [
          'a limits node around ∏',
          [limits(char('∏'), lower, upper), char('i')],
          b.product(i, i, num('1'), n),
        ],
        [
          'a limits node around Π',
          [limits(char('Π'), lower, upper), char('i')],
          b.product(i, i, num('1'), n),
        ],
        [
          '∑ followed by a subsup',
          [char('∑'), subsup(lower, [char('∞')]), char('i')],
          b.sum(i, i, num('1'), b.infinity()),
        ],
        [
          '∏ followed by a subsup',
          [char('∏'), subsup(lower, upper), char('i')],
          b.product(i, i, num('1'), n),
        ],
        [
          'the argument ends at the next +',
          [limits(char('∑'), lower, upper), ...util.row('2i+1').children],
          b.add([b.sum(b.mul([num('2'), i], true), i, num('1'), n), num('1')]),
        ],
        [
          'a sum after an operand is implicitly multiplied',
          [char('2'), limits(char('∑'), lower, upper), char('i')],
          b.mul([num('2'), b.sum(i, i, num('1'), n)], true),
        ],
        [
          'a sum after a ∑ char and an operand is implicitly multiplied',
          [char('2'), char('∑'), subsup(lower, upper), char('i')],
          b.mul([num('2'), b.sum(i, i, num('1'), n)], true),
        ],
      ])('%s', (_, children, expected) => {
        expect(strip(parser.parse(row(children)))).toEqual(strip(expected));
      });

      test.each([
        [
          'no limits',
          [char('∑'), char('i')],
          "'∑' needs a lower and an upper limit",
        ],
        [
          'empty limits, as the editor creates them',
          [limits(char('∑'), [], []), char('i')],
          "'∑' needs a lower and an upper limit",
        ],
        [
          'no upper limit',
          [char('∏'), subsup(lower), char('i')],
          "'∏' needs a lower and an upper limit",
        ],
        [
          'a lower limit without a variable',
          [limits(char('∑'), [char('1')], upper), char('i')],
          "The lower limit of '∑' must be of the form 'i=…', where 'i' is a variable",
        ],
        [
          'no argument',
          [limits(char('∑'), lower, upper)],
          'Missing argument for ∑',
        ],
      ])('%s throws', (_, children, message) => {
        expect(() => parser.parse(row(children))).toThrow(message);
      });
    });

    describe('limits', () => {
      const lim = (...sub: string[]): types.CharNode[] => [
        char('lim'),
        subsup(sub.map((c) => char(c))),
      ];
      test.each([
        [
          'lim_{x→0} x',
          [...lim('x', '→', '0'), char('x')],
          b.limit(x, x, b.number('0'), 'both'),
        ],
        [
          'lim_{x→-1} x',
          [...lim('x', '→', '−', '1'), char('x')],
          b.limit(x, x, b.neg(b.number('1')), 'both'),
        ],
        [
          'lim_{x→0^+} x',
          [
            char('lim'),
            subsup([
              char('x'),
              char('→'),
              char('0'),
              subsup(undefined, [char('+')]),
            ]),
            char('x'),
          ],
          b.limit(x, x, b.number('0'), 'right'),
        ],
        [
          'lim_{x→0^-} x',
          [
            char('lim'),
            subsup([
              char('x'),
              char('→'),
              char('0'),
              subsup(undefined, [char('−')]),
            ]),
            char('x'),
          ],
          b.limit(x, x, b.number('0'), 'left'),
        ],
        [
          'a limits node around lim',
          [
            limits(util.row('lim'), [char('x'), char('→'), char('0')]),
            char('x'),
          ],
          b.limit(x, x, b.number('0'), 'both'),
        ],
        [
          'the argument ends at the next +',
          [...lim('x', '→', '0'), ...util.row('2x+1').children],
          b.add([
            b.limit(b.mul([num('2'), x], true), x, b.number('0'), 'both'),
            num('1'),
          ]),
        ],
      ])('%s', (_, children, expected) => {
        expect(strip(parser.parse(row(children)))).toEqual(strip(expected));
      });

      test.each([
        [
          'no subscript',
          [char('lim'), char('x')],
          "'lim' needs a subscript of the form 'x→a'",
        ],
        [
          'no arrow',
          [...lim('x', '=', '0'), char('x')],
          "The subscript of 'lim' must be of the form 'x→a'",
        ],
        [
          'no target',
          [...lim('x', '→'), char('x')],
          "The subscript of 'lim' must be of the form 'x→a'",
        ],
        [
          "a target that isn't a number",
          [...lim('x', '→', '∞'), char('x')],
          "A limit to something other than a number isn't supported yet",
        ],
        ['no argument', lim('x', '→', '0'), 'Missing argument for lim'],
      ])('%s throws', (_, children, message) => {
        expect(() => parser.parse(row(children))).toThrow(message);
      });
    });

    describe('mod and det', () => {
      test.each([
        ['x mod n', [char('x'), char('mod'), char('n')], b.mod(x, n)],
        [
          'mod binds like ÷',
          [
            ...util.row('2x').children,
            char('mod'),
            ...util.row('n+1').children,
          ],
          b.add([b.mod(b.mul([num('2'), x], true), n), num('1')]),
        ],
        [
          'mod is left associative',
          [char('x'), char('mod'), char('y'), char('mod'), char('n')],
          b.mod(b.mod(x, y), n),
        ],
        ['det A', [char('det'), char('A')], b.determinant(A)],
      ])('%s', (_, children, expected) => {
        expect(strip(parser.parse(row(children)))).toEqual(strip(expected));
      });

      test('mod without a left operand throws', () => {
        expect(() => parser.parse(row([char('mod'), char('n')]))).toThrow(
          'Missing left operand for mod',
        );
      });
    });

    describe('unsupported symbols', () => {
      test.each([
        ['an arrow', util.row('x→y').children, "'→' isn't supported yet"],
        [
          'an arrow at the start',
          util.row('→y').children,
          "'→' isn't supported yet",
        ],
        [
          'a named function',
          [char('max'), char('x')],
          "'max' isn't supported yet",
        ],
        [
          'an accent',
          [builders.accent([char('v')], AccentType.Vec)],
          "'\\vec' isn't supported yet",
        ],
        [
          'an accent after an operand',
          [char('a'), builders.accent([char('v')], AccentType.Vec)],
          "'\\vec' isn't supported yet",
        ],
        ['an integral', util.row('∫x').children, "'∫' isn't supported yet"],
        [
          '/',
          util.row('x/y').children,
          "'/' isn't supported yet, use a fraction (\\frac in TeX) instead",
        ],
      ])('%s throws', (_, children, message) => {
        expect(() => parser.parse(row(children))).toThrow(message);
      });
    });
  });
});
