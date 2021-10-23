import { parse } from '../text-parser';
import { serializer } from '../serializer';

expect.addSnapshotSerializer(serializer);

describe('TextParser', () => {
  it('parse addition', () => {
    const ast = parse('1 + 2');

    expect(ast).toMatchInlineSnapshot(`(Add 1 2)`);
  });

  it('parse n-ary addition', () => {
    const ast = parse('1 + 2 + a');

    expect(ast).toMatchInlineSnapshot(`(Add 1 2 a)`);
  });

  it('parses minus', () => {
    const ast = parse('a - b');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              a
              (neg.sub b))
        `);
  });

  it('parses minus in longer expression', () => {
    const ast = parse('a + b - c + d');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              a
              b
              (neg.sub c)
              d)
        `);
  });

  it('parses simple order of operations', () => {
    const ast = parse('1 + 2 * 3 - 4');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              1
              (mul.exp 2 3)
              (neg.sub 4))
        `);
  });

  it('parses unary minus', () => {
    const ast = parse('-a');

    expect(ast).toMatchInlineSnapshot(`(neg a)`);
  });

  it('parses unary minus with addition', () => {
    const ast = parse('a + -a');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              a
              (neg a))
        `);
  });

  it('parses multiple unary minuses', () => {
    const ast = parse('--a');

    expect(ast).toMatchInlineSnapshot(`(neg (neg a))`);
  });

  it('parses unary and binary minus', () => {
    const ast = parse('a - -b');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              a
              (neg.sub (neg b)))
        `);
  });

  it('parses implicit multiplication', () => {
    const ast = parse('ab');

    expect(ast).toMatchInlineSnapshot(`(mul.imp a b)`);
  });

  it('negation is lower precedence than implicit multplication', () => {
    const ast = parse('-ab');

    expect(ast).toMatchInlineSnapshot(`(neg (mul.imp a b))`);
  });

  it('negation is higher precedence than division', () => {
    const ast = parse('-a / b');

    expect(ast).toMatchInlineSnapshot(`
            (Div
              (neg a)
              b)
        `);
  });

  it('negation is higher precedence than division (w/ parens)', () => {
    const ast = parse('-(a / b)');

    expect(ast).toMatchInlineSnapshot(`(neg (Div a b))`);
  });

  // TODO: document this in the semantic README.md
  it('polynomial with subtraction', () => {
    const ast = parse('7x - 5x');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              (mul.imp 7 x)
              (neg.sub (mul.imp 5 x)))
        `);
  });

  // TODO: document this in the semantic README.md
  it('polynomial with additive inverse', () => {
    const ast = parse('7x + -5x');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              (mul.imp 7 x)
              (neg (mul.imp 5 x)))
        `);
  });

  it('negation is higher precedence than explicit multplication', () => {
    const ast = parse('-a * b');

    expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (neg a)
              b)
        `);
  });

  it('negation can be on individual factors when wrapped in parens', () => {
    const ast = parse('(-a)(b)');

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg a)
              b)
        `);
  });

  it('implicit multiplication is higher precedence than addition', () => {
    const ast = parse('ab + cd');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              (mul.imp a b)
              (mul.imp c d))
        `);
  });

  it('parses n-ary implicit multiplication', () => {
    const ast = parse('abc');

    expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
  });

  it('parses explicit multiplication', () => {
    const ast = parse('1 * 2 * 3');

    expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
  });

  it('parses explicit and implicit multiplication separately', () => {
    const ast = parse('ab * cd');

    expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (mul.imp a b)
              (mul.imp c d))
        `);
  });

  it('parses division with higher precedence than explicit multiplication', () => {
    const ast = parse('a/b * c/d');

    expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (Div a b)
              (Div c d))
        `);
  });

  it('parses division with lower precedence than implicit multiplication', () => {
    const ast = parse('ab/cd * uv/xy');

    expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (Div
                (mul.imp a b)
                (mul.imp c d))
              (Div
                (mul.imp u v)
                (mul.imp x y)))
        `);
  });

  it('parses parenthesis', () => {
    const ast = parse('(x + y)');

    expect(ast).toMatchInlineSnapshot(`(Parens (Add x y))`);
  });

  it('throws if lparen is missing', () => {
    expect(() => {
      parse('x + y)');
    }).toThrowErrorMatchingInlineSnapshot(`"unmatched right paren"`);
  });

  it('throws if rparen is missing', () => {
    expect(() => {
      parse('(x + y');
    }).toThrowErrorMatchingInlineSnapshot(`"unmatched left paren"`);
  });

  it('throws if we run into an unexpected EOL', () => {
    expect(() => {
      parse('x +');
    }).toThrowErrorMatchingInlineSnapshot(`"Unexpected 'eol' token"`);
  });

  it('implicit multiplication w/ parenthesis', () => {
    const ast = parse('a(x + y)');

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (Add x y))
        `);
  });

  it('parses adding parenthesis', () => {
    const ast = parse('(a + b) + (x + y)');

    expect(ast).toMatchInlineSnapshot(`
            (Add
              (Add a b)
              (Add x y))
        `);
  });

  it('parses implicit multiplication by parens', () => {
    const ast = parse('(a + b)(x + y)');

    expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (Add a b)
              (Add x y))
        `);
  });

  it('parses n-ary implicit multiplication by parens', () => {
    const ast = parse('(a)(b)(c)');

    expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
  });

  it('parses division', () => {
    const ast = parse('x / y');

    expect(ast).toMatchInlineSnapshot(`(Div x y)`);
  });

  it('parses nested division', () => {
    const ast = parse('x / y / z');

    expect(ast).toMatchInlineSnapshot(`
            (Div
              (Div x y)
              z)
        `);
  });

  it('parses exponents', () => {
    const ast = parse('x^2');

    expect(ast).toMatchInlineSnapshot(`(Power :base x :exp 2)`);
  });

  it('parses nested exponents', () => {
    const ast = parse('2^3^4');

    expect(ast).toMatchInlineSnapshot(`
            (Power
              :base 2
              :exp (Power :base 3 :exp 4))
        `);
  });

  it('parses equations', () => {
    const ast = parse('y = x + 1');

    expect(ast).toMatchInlineSnapshot(`
            (Equals
              y
              (Add x 1))
        `);
  });

  it('parses n-ary equations', () => {
    const ast = parse('x = y = z');

    expect(ast).toMatchInlineSnapshot(`(Equals x y z)`);
  });

  it('parses (5)2 as (mul 5 2)', () => {
    const ast = parse('(5)2');

    expect(ast).toMatchInlineSnapshot(`(mul.imp 5 2)`);
  });

  describe('excess parentheses', () => {
    it('excess parens 1', () => {
      const ast = parse('(x + y)');

      expect(ast).toMatchInlineSnapshot(`(Parens (Add x y))`);
    });

    it('excess parens 2', () => {
      const ast = parse('(x) + (y)');

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  (Parens x)
                  (Parens y))
            `);
    });

    it('excess parens 3', () => {
      const ast = parse('(a * b) + (c * d)');

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  (Parens (mul.exp a b))
                  (Parens (mul.exp c d)))
            `);
    });

    it('excess parens 4', () => {
      const ast = parse('((a + b))((c))');

      expect(ast).toMatchInlineSnapshot(`
                (mul.imp
                  (Parens (Add a b))
                  (Parens c))
            `);
    });

    // If we want to always wrap negative numbers in parentheses, we can do
    // that in the printing and make it configurable.
    it('excess parens 5', () => {
      const ast = parse('a + (-b)');

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  a
                  (Parens (neg b)))
            `);
    });

    it('fractions 1', () => {
      const ast = parse('(a) / (b)');

      expect(ast).toMatchInlineSnapshot(`
                (Div
                  (Parens a)
                  (Parens b))
            `);
    });

    it('fractions 2', () => {
      const ast = parse('(a/b)');

      expect(ast).toMatchInlineSnapshot(`(Parens (Div a b))`);
    });

    it('fractions 3', () => {
      const ast = parse('(1/a)(1/b)');

      expect(ast).toMatchInlineSnapshot(`
                (mul.imp
                  (Div 1 a)
                  (Div 1 b))
            `);
    });

    it('exponent 1', () => {
      const ast = parse('a^(2)');

      expect(ast).toMatchInlineSnapshot(`
                (Power
                  :base a
                  :exp (Parens 2))
            `);
    });

    it('exponent 2', () => {
      const ast = parse('e^(x + y)');

      expect(ast).toMatchInlineSnapshot(`
                (Power
                  :base e
                  :exp (Add x y))
            `);
    });

    it('negative 1', () => {
      const ast = parse('-a');

      expect(ast).toMatchInlineSnapshot(`(neg a)`);
    });

    it('negative 2', () => {
      const ast = parse('--a');

      expect(ast).toMatchInlineSnapshot(`(neg (neg a))`);
    });

    it('not excess parens', () => {
      const ast = parse('1 + (x + y)');

      expect(ast).toMatchInlineSnapshot(`
                (Add
                  1
                  (Add x y))
            `);
    });
  });
});
