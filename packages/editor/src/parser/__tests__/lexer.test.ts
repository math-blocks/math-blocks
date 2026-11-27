import {
  row,
  char,
  frac,
  subsup,
  limits,
  delimited,
} from '../../char/builders';
import * as util from '../../char/util';

import * as Lexer from '../lexer';
import { serializer } from '../../token/serializer';

expect.addSnapshotSerializer(serializer);

describe('Lexer', () => {
  describe('lex', () => {
    it('should coalesce integers', () => {
      const glyphTree = row([char('1'), char('2'), char('3')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:3 123))
                `);
    });

    it('should coalesce reals', () => {
      const glyphTree = row([char('1'), char('.'), char('3')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:3 1.3))
                `);
    });

    it('should lex both an ASCII hyphen-minus and a minus sign as Minus', () => {
      const glyphTree = row([
        char('a'),
        char('-'),
        char('b'),
        char('\u2212'),
        char('c'),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
        (row 
          (Identifier@[]:0:1 a) 
          Minus@[]:1:2 
          (Identifier@[]:2:3 b) 
          Minus@[]:3:4 
          (Identifier@[]:4:5 c))
      `);
    });

    it('should lex \u00D7 and \u22C5 as Times', () => {
      const glyphTree = row([
        char('a'),
        char('\u00D7'),
        char('b'),
        char('\u22C5'),
        char('c'),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
        (row 
          (Identifier@[]:0:1 a) 
          Times@[]:1:2 
          (Identifier@[]:2:3 b) 
          Times@[]:3:4 
          (Identifier@[]:4:5 c))
      `);
    });

    it('should throw on chars it does not recognize', () => {
      expect(() =>
        Lexer.lexRow(row([char('a'), char('\u00A7'), char('b')])),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Unexpected character '§' (U+00A7)]`,
      );
    });

    it('should name a char outside the BMP as one code point', () => {
      // U+1D465 MATHEMATICAL ITALIC SMALL X is a surrogate pair in UTF-16.
      expect(() =>
        Lexer.lexRow(row([char('a'), char('\u{1D465}'), char('b')])),
      ).toThrow("Unexpected character '\u{1D465}' (U+1D465)");
    });

    it('should lex `1 + a`', () => {
      const glyphTree = row([char('1'), char('+'), char('a')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
    });

    it('should lex `1 \u00B7 a`', () => {
      const glyphTree = row([char('1'), char('\u00B7'), char('a')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Times@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
    });

    it('should lex `1 * a`', () => {
      const glyphTree = row([char('1'), char('*'), char('a')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Times@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
    });

    it('should lex `1 + 1/x`', () => {
      const glyphTree = row([
        char('1'),
        char('+'),
        frac([char('1')], [char('x')]),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  (frac@[]:2:3 (row 
                    (Number@[2,0]:0:1 1)) (row 
                    (Identifier@[2,1]:0:1 x))))
            `);
    });

    it('should lex `e^x`', () => {
      const glyphTree = row([char('e'), subsup(undefined, [char('x')])]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 e) 
                  (subsup@[]:1:2 ^ (row 
                    (Identifier@[1,1]:0:1 x))))
            `);
    });

    it('should lex `a_n`', () => {
      const glyphTree = row([char('a'), subsup([char('n')], undefined)]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 a) 
                  (subsup@[]:1:2 (row 
                    (Identifier@[1,0]:0:1 n)) _))
            `);
    });

    it('should lex `a_n^2`', () => {
      const glyphTree = row([char('a'), util.subsup('n', '2')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 a) 
                  (subsup@[]:1:2 (row 
                    (Identifier@[1,0]:0:1 n)) (row 
                    (Number@[1,1]:0:1 2))))
            `);
    });

    it('should lex parens', () => {
      const glyphTree = util.row('(1 + 2)');
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  LeftParens@[]:0:1 
                  (Number@[]:1:2 1) 
                  Plus@[]:3:4 
                  (Number@[]:5:6 2) 
                  RightParens@[]:6:7)
                `);
    });

    it('should lex a square root', () => {
      const glyphTree = row([util.sqrt('123')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 (row 
                    (Number@[0,0]:0:3 123)) _))
            `);
    });

    it('should lex a nth root', () => {
      const glyphTree = row([util.root('123', 'n')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 n)) (row 
                    (Number@[0,1]:0:3 123))))
            `);
    });

    it('should lex multi character identifiers', () => {
      const glyphTree = row([char('s'), char('i'), char('n')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:3 sin))
            `);
    });

    it('should lex a minus sign', () => {
      const glyphTree = row([char('1'), char('\u2212'), char('2')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Minus@[]:1:2 
                  (Number@[]:2:3 2))
            `);
    });

    it('should lex an equal sign', () => {
      const glyphTree = row([char('1'), char('='), char('2')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Equal@[]:1:2 
                  (Number@[]:2:3 2))
            `);
    });

    it('should lex an ellipsis', () => {
      const glyphTree = util.row('1+...+n');
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  Ellipsis@[]:2:5 
                  Plus@[]:5:6 
                  (Identifier@[]:6:7 n))
                `);
    });

    it('should lex summation with limits', () => {
      const glyphTree = row([
        limits(
          char('\u03a3'),
          [char('i'), char('='), char('0')],
          [char('\u221e')],
        ),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
        (row 
          (limits{SummationOperator@[]:0:1}@[]:0:1 (row 
            (Identifier@[0,0]:0:1 i) 
            Equal@[0,0]:1:2 
            (Number@[0,0]:2:3 0)) (row 
            (Identifier@[0,1]:0:1 ∞))))
      `);
    });

    it('should lex products with limits', () => {
      const glyphTree = row([
        limits(
          char('\u03a0'),
          [char('i'), char('='), char('0')],
          [char('\u221e')],
        ),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
        (row 
          (limits{ProductOperator@[]:0:1}@[]:0:1 (row 
            (Identifier@[0,0]:0:1 i) 
            Equal@[0,0]:1:2 
            (Number@[0,0]:2:3 0)) (row 
            (Identifier@[0,1]:0:1 ∞))))
      `);
    });

    // The editor and `Tex.parse` use the n-ary summation and product signs,
    // and the Greek capitals are also accepted.
    it.each([
      ['\u2211 (n-ary summation)', '\u2211', 'SummationOperator'],
      ['\u03a3 (Greek capital sigma)', '\u03a3', 'SummationOperator'],
      ['\u220f (n-ary product)', '\u220f', 'ProductOperator'],
      ['\u03a0 (Greek capital pi)', '\u03a0', 'ProductOperator'],
    ])('should lex limits around %s as a %s', (_, op, expected) => {
      const glyphTree = row([limits(char(op), [char('i')], [char('n')])]);
      const [node] = Lexer.lexRow(glyphTree).children;
      expect(node.type === 'limits' && node.inner).toMatchObject({
        type: 'token',
        name: expected,
      });
    });

    it('should lex \u2211 and \u220f outside of a limits node', () => {
      const glyphTree = row([
        char('\u2211'),
        subsup([char('i'), char('='), char('0')], [char('\u221e')]),
        char('\u220f'),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
        (row 
          SummationOperator@[]:0:1 
          (subsup@[]:1:2 (row 
            (Identifier@[1,0]:0:1 i) 
            Equal@[1,0]:1:2 
            (Number@[1,0]:2:3 0)) (row 
            (Identifier@[1,1]:0:1 ∞))) 
          ProductOperator@[]:2:3)
      `);
    });

    it.each([
      ['\u2213', 'MinusPlus'], // ∓ minus-plus sign (\mp)
      ['\u2208', 'ElementOf'], // ∈ element of (\in)
      ['\u2209', 'NotElementOf'], // ∉ not an element of (\notin)
      ['\u220b', 'Contains'], // ∋ contains as member (\ni)
      ['\u220c', 'NotContains'], // ∌ does not contain as member (\notni)
      ['\u2286', 'Subset'], // ⊆ subset of or equal to (\subseteq)
      ['\u2282', 'ProperSubset'], // ⊂ subset of (\subset)
      ['\u2287', 'Superset'], // ⊇ superset of or equal to (\supseteq)
      ['\u2283', 'ProperSuperset'], // ⊃ superset of (\supset)
      ['\u222a', 'Union'], // ∪ union (\cup)
      ['\u2229', 'Intersection'], // ∩ intersection (\cap)
      ['\u2192', 'RightArrow'], // → rightwards arrow (\to)
      ['\u2026', 'Ellipsis'], // … horizontal ellipsis (\ldots)
      ['\u22ef', 'Ellipsis'], // ⋯ midline horizontal ellipsis (\cdots)
    ])('should lex %s as %s', (symbol, expected) => {
      const glyphTree = row([char('a'), char(symbol), char('b')]);
      const [, token] = Lexer.lexRow(glyphTree).children;
      expect(token).toMatchObject({ type: 'token', name: expected });
    });

    // The parser decides which constant each of these stands for.
    it.each([
      '\u221e', // ∞ infinity (\infty)
      '\u2205', // ∅ empty set (\emptyset)
      '\u2115', // ℕ natural numbers (\N)
      '\u2124', // ℤ integers (\Z)
      '\u211a', // ℚ rational numbers (\Q)
      '\u211d', // ℝ real numbers (\R)
      '\u2102', // ℂ complex numbers (\C)
    ])('should lex %s as an identifier', (symbol) => {
      const [token] = Lexer.lexRow(row([char(symbol)])).children;
      expect(token).toMatchObject({
        type: 'token',
        name: 'Identifier',
        value: symbol,
      });
    });

    it.each([
      ['/', "'/' isn't supported yet, use a fraction (\\frac in TeX) instead"],
      ['!', "'!' isn't supported yet"],
      ["'", "''' isn't supported yet"],
      ['%', "'%' isn't supported yet"],
      [':', "':' isn't supported yet"],
      [';', "';' isn't supported yet"],
      ['[', "'[' isn't supported yet"],
      [']', "']' isn't supported yet"],
      ['{', "'{' isn't supported yet"],
      ['}', "'}' isn't supported yet"],
      ['\u2190', "'\u2190' isn't supported yet"], // ← leftwards arrow (\leftarrow)
      ['\u2191', "'\u2191' isn't supported yet"], // ↑ upwards arrow (\uparrow)
      ['\u2193', "'\u2193' isn't supported yet"], // ↓ downwards arrow (\downarrow)
      ['\u210d', "'\u210d' isn't supported yet"], // ℍ quaternions (\H)
      ['\u2119', "'\u2119' isn't supported yet"], // ℙ primes (\P)
      ['\u222b', "'\u222b' isn't supported yet"], // ∫ integral (\int)
      ['\u222c', "'\u222c' isn't supported yet"], // ∬ double integral (\iint)
      ['\u222d', "'\u222d' isn't supported yet"], // ∭ triple integral (\iiint)
      ['\u2248', "'\u2248' isn't supported yet"], // ≈ almost equal to (\approx)
      ['\u22a5', "'\u22a5' isn't supported yet"], // ⊥ perpendicular (\perp)
      ['\u2225', "'\u2225' isn't supported yet"], // ∥ parallel to (\parallel)
      ['\u2218', "'\u2218' isn't supported yet"], // ∘ ring operator (\circ)
      ['?', "Unexpected character '?' (U+003F)"],
    ])('should throw on %s', (symbol, message) => {
      const glyphTree = row([char('a'), char(symbol), char('b')]);
      expect(() => Lexer.lexRow(glyphTree)).toThrow(message);
    });

    it.each([
      [
        'an integral with limits',
        limits(char('\u222b'), [char('0')], [char('1')]),
        "'\u222b' isn't supported yet",
      ],
      [
        'brackets',
        delimited([char('a')], char('['), char(']')),
        "'[' isn't supported yet",
      ],
      [
        'braces',
        delimited([char('a')], char('{'), char('}')),
        "'{' isn't supported yet",
      ],
    ])('should throw on %s', (_, node, message) => {
      expect(() => Lexer.lexRow(row([node]))).toThrow(message);
    });

    // TODO(kevinb): Update lexer to handle operators with multiple characters
    // correctly.
    it.skip('should lex lim', () => {
      // TODO: we should have the editor convert "-", ">" into a unicode
      // arrow.
      const glyphTree = row([
        limits(util.row('lim'), [char('i'), char('-'), char('>'), char('0')]),
      ]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (limits{Lim@[]:0:1}@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 i) 
                    (Number@[0,0]:3:4 0)) _))
                `);
    });

    // TODO: revisit how we handle empty cells within vertical layouts
    it.skip('should throw on empty row', () => {
      const glyphTree = row([]);
      expect(() => {
        Lexer.lexRow(glyphTree);
      }).toThrowErrorMatchingInlineSnapshot(`"rows cannot be empty"`);
    });

    describe('scanner', () => {
      // Lexes `chars`, a string with one char per code point, to a list of
      // `name value` strings, e.g. `Identifier x` or `Plus`.
      const lexTokens = (
        text: string,
        options?: Lexer.LexOptions,
      ): readonly string[] =>
        Lexer.lexRow(
          row([...text].map((c) => char(c))),
          [],
          options,
        ).children.map((node) =>
          node.type === 'token'
            ? 'value' in node
              ? `${node.name} ${node.value}@${node.loc.start}:${node.loc.end}`
              : `${node.name}@${node.loc.start}:${node.loc.end}`
            : node.type,
        );

      it('should throw on a capital Greek letter on its own', () => {
        expect(() => lexTokens('Σ')).toThrow(
          "Unexpected character 'Σ' (U+03A3)",
        );
        expect(() => lexTokens('Γx')).toThrow(
          "Unexpected character 'Γ' (U+0393)",
        );
      });

      it('should still lex lowercase Greek letters as identifiers', () => {
        expect(lexTokens('αω')).toEqual([
          'Identifier α@0:1',
          'Identifier ω@1:2',
        ]);
      });

      it('should match function names case-sensitively', () => {
        expect(lexTokens('SIN')).toEqual([
          'Identifier S@0:1',
          'Identifier I@1:2',
          'Identifier N@2:3',
        ]);
        expect(lexTokens('Sin')).toEqual([
          'Identifier S@0:1',
          'Identifier i@1:2',
          'Identifier n@2:3',
        ]);
      });

      it('should match the longest function name', () => {
        expect(lexTokens('arcsinx')).toEqual([
          'Identifier arcsin@0:6',
          'Identifier x@6:7',
        ]);
        expect(lexTokens('limsupx')).toEqual([
          'Identifier limsup@0:6',
          'Identifier x@6:7',
        ]);
      });

      it('should end a word at whitespace without requiring it', () => {
        expect(lexTokens('sinx')).toEqual([
          'Identifier sin@0:3',
          'Identifier x@3:4',
        ]);
        expect(lexTokens('sin hx')).toEqual([
          'Identifier sin@0:3',
          'Identifier h@4:5',
          'Identifier x@5:6',
        ]);
        expect(lexTokens('si n')).toEqual([
          'Identifier s@0:1',
          'Identifier i@1:2',
          'Identifier n@3:4',
        ]);
      });

      it('should lex typed letters one at a time with requireBackslash', () => {
        expect(lexTokens('sinx', { requireBackslash: true })).toEqual([
          'Identifier s@0:1',
          'Identifier i@1:2',
          'Identifier n@2:3',
          'Identifier x@3:4',
        ]);
        const glyphTree = row([char('sin'), char('x')]);
        expect(Lexer.lexRow(glyphTree, [], { requireBackslash: true }))
          .toMatchInlineSnapshot(`
          (row 
            (Identifier@[]:0:1 sin) 
            (Identifier@[]:1:2 x))
        `);
      });

      it('should pass requireBackslash to nested rows', () => {
        const glyphTree = row([frac([char('l'), char('n')], [char('x')])]);
        expect(Lexer.lexRow(glyphTree, [], { requireBackslash: true }))
          .toMatchInlineSnapshot(`
            (row 
              (frac@[]:0:1 (row 
                (Identifier@[0,0]:0:1 l) 
                (Identifier@[0,0]:1:2 n)) (row 
                (Identifier@[0,1]:0:1 x))))
          `);
      });

      it.each([
        ['12', ['Number 12@0:2']],
        ['1.5', ['Number 1.5@0:3']],
        ['.5', ['Number .5@0:2']],
        ['1.', ['Number 1.@0:2']],
        ['1 2', ['Number 1@0:1', 'Number 2@2:3']],
        ['1...', ['Number 1@0:1', 'Ellipsis@1:4']],
        ['1.5...', ['Number 1.5@0:3', 'Ellipsis@3:6']],
        ['...5', ['Ellipsis@0:3', 'Number 5@3:4']],
      ])('should lex the number in %s', (text, expected) => {
        expect(lexTokens(text)).toEqual(expected);
      });

      it('should throw on a number with two decimal points', () => {
        expect(() => lexTokens('1.2.3')).toThrow(
          "'1.2.3' has more than one decimal point",
        );
        expect(() => lexTokens('x+1.2.')).toThrow(
          "'1.2.' has more than one decimal point",
        );
      });

      it('should throw on a lone or doubled `.`', () => {
        expect(() => lexTokens('a.b')).toThrow(
          "Unexpected character '.' (U+002E)",
        );
        expect(() => lexTokens('1..')).toThrow(
          "Unexpected character '.' (U+002E)",
        );
      });

      it('should lex `x_1...` with an ellipsis', () => {
        // The ellipsis typed after the subscript, and typed inside it.
        const after = row([
          char('x'),
          subsup([char('1')], undefined),
          char('.'),
          char('.'),
          char('.'),
        ]);
        expect(Lexer.lexRow(after)).toMatchInlineSnapshot(`
          (row 
            (Identifier@[]:0:1 x) 
            (subsup@[]:1:2 (row 
              (Number@[1,0]:0:1 1)) _) 
            Ellipsis@[]:2:5)
        `);
        const inside = row([
          char('x'),
          subsup([char('1'), char('.'), char('.'), char('.')], undefined),
        ]);
        expect(Lexer.lexRow(inside)).toMatchInlineSnapshot(`
          (row 
            (Identifier@[]:0:1 x) 
            (subsup@[]:1:2 (row 
              (Number@[1,0]:0:1 1) 
              Ellipsis@[1,0]:1:4) _))
        `);
      });

      it('should name a char outside the BMP that comes before a valid char', () => {
        expect(() => lexTokens('\u{1D465}x')).toThrow(
          "Unexpected character '\u{1D465}' (U+1D465)",
        );
        expect(() => lexTokens('x\u{1D465}1')).toThrow(
          "Unexpected character '\u{1D465}' (U+1D465)",
        );
      });

      it('should use char indices for locations after a multi-letter char', () => {
        const glyphTree = row([char('ln'), char('x'), char('+'), char('1')]);
        expect(Lexer.lexRow(glyphTree)).toMatchInlineSnapshot(`
          (row 
            (Identifier@[]:0:1 ln) 
            (Identifier@[]:1:2 x) 
            Plus@[]:2:3 
            (Number@[]:3:4 1))
        `);
      });
    });

    it('should lex less than', () => {
      const glyphTree = row([char('x'), char('<'), char('y')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
(row 
  (Identifier@[]:0:1 x) 
  LessThan@[]:1:2 
  (Identifier@[]:2:3 y))
`);
    });

    it('should lex less than or equal', () => {
      const glyphTree = row([char('x'), char('≤'), char('y')]);
      const tokenTree = Lexer.lexRow(glyphTree);

      expect(tokenTree).toMatchInlineSnapshot(`
(row 
  (Identifier@[]:0:1 x) 
  LessThanOrEqual@[]:1:2 
  (Identifier@[]:2:3 y))
`);
    });
  });
});
