import * as Testing from '@math-blocks/testing';
import { NodeType } from '@math-blocks/semantic';

import * as builders from '../../char/builders';
import * as util from '../../char/util';

import * as parser from '../parser';

const { row, char, subsup } = builders;

expect.addSnapshotSerializer(Testing.serializer);

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
      `"subscripts are only allowed on identifiers"`,
    );
  });

  it('should throw when an atom is expected', () => {
    const input = util.row('2-');

    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected 'EOL' atom"`,
    );
  });

  it("should throw on a trailing '+'", () => {
    const input = util.row('2+2+');

    expect(() => parser.parse(input)).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected 'EOL' atom"`,
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

  describe("'algebra' tables", () => {
    it('should parse three rows', () => {
      const input = builders.row([
        builders.algebra(
          [
            // first row
            [char('2'), char('x')],
            [char('=')],
            [char('5')],

            // second row
            [],
            [],
            [char('\u2212'), char('5')],

            // third row
            [char('2'), char('x')],
            [char('=')],
            [char('0')],
          ],
          3,
          3,
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast.type).toEqual('VerticalAdditionToRelation');

      expect(ast).toMatchInlineSnapshot(`
                (VerticalAdditionToRelation
                  :relOp eq
                  :originalRelation (eq (mul.imp 2 x) 5)
                  :actions (eq null (neg.sub 5))
                  :resultingRelation (eq (mul.imp 2 x) 0))
                `);
    });

    it('should coalesce operators and associated operands', () => {
      const input = builders.row([
        builders.algebra(
          [
            // first row
            [char('2'), char('x')],
            [char('=')],
            [],
            [char('5')],

            // second row
            [],
            [],
            [char('+')],
            [char('\u2212'), char('5')],

            // third row
            [char('2'), char('x')],
            [char('=')],
            [],
            [char('0')],
          ],
          4,
          3,
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast.type).toEqual('VerticalAdditionToRelation');

      expect(ast).toMatchInlineSnapshot(`
                (VerticalAdditionToRelation
                  :relOp eq
                  :originalRelation (eq (mul.imp 2 x) 5)
                  :actions (eq null (neg 5))
                  :resultingRelation (eq (mul.imp 2 x) 0))
            `);
    });

    it('should handle operators after the first operand', () => {
      const input = builders.row([
        builders.algebra(
          [
            // first row
            [],
            [],
            [char('2'), char('x')],
            [char('=')],
            [char('5')],

            // second row
            [char('5')],
            [char('+')],
            [],
            [],
            [],

            // third row
            [char('5')],
            [char('+')],
            [char('2'), char('x')],
            [char('=')],
            [char('0')],
          ],
          5,
          3,
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast.type).toEqual('VerticalAdditionToRelation');

      expect(ast).toMatchInlineSnapshot(`
                (VerticalAdditionToRelation
                  :relOp eq
                  :originalRelation (eq (add null (mul.imp 2 x)) 5)
                  :actions (eq (add 5 null) null)
                  :resultingRelation (eq (add 5 (mul.imp 2 x)) 0))
                `);
    });

    it('should parse two rows', () => {
      const input = builders.row([
        builders.algebra(
          [
            // first row
            [char('2'), char('x')],
            [char('=')],
            [char('5')],

            // second row
            [],
            [],
            [char('\u2212'), char('5')],
          ],
          3,
          2,
        ),
      ]);

      const ast = parser.parse(input);

      expect(ast.type).toEqual('VerticalAdditionToRelation');

      expect(ast).toMatchInlineSnapshot(`
                (VerticalAdditionToRelation
                  :relOp eq
                  :originalRelation (eq (mul.imp 2 x) 5)
                  :actions (eq null (neg.sub 5))
                  :resultingRelation null)
            `);
    });
  });
});
