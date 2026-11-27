import { builders, util, AccentType } from '@math-blocks/editor';

import { parse } from '../parser';

describe('Parser', () => {
  test('ASCII hyphen-minus becomes a minus sign', () => {
    const row = parse('a-b');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('a'),
          builders.char('\u2212'),
          builders.char('b'),
        ]),
      ),
    ).toBe(true);
  });

  test('subsup', () => {
    const row = parse('\\int_0^1');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('\u222b'),
          builders.subsup([builders.char('0')], [builders.char('1')]),
        ]),
      ),
    ).toBe(true);
  });

  test('sub', () => {
    const row = parse('a_n');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('a'),
          builders.subsup([builders.char('n')]),
        ]),
      ),
    ).toBe(true);
  });

  test('sub with braces', () => {
    const row = parse('\\lim_{x\\rightarrow0}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('lim'),
          builders.subsup([
            builders.char('x'),
            builders.char('\u2192'),
            builders.char('0'),
          ]),
        ]),
      ),
    ).toBe(true);
  });

  test('sup', () => {
    const row = parse('x^2y^2');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('x'),
          builders.subsup(undefined, [builders.char('2')]),
          builders.char('y'),
          builders.subsup(undefined, [builders.char('2')]),
        ]),
      ),
    ).toBe(true);
  });

  test('sup with braces', () => {
    const row = parse('a^{b^c}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('a'),
          builders.subsup(undefined, [
            builders.char('b'),
            builders.subsup(undefined, [builders.char('c')]),
          ]),
        ]),
      ),
    ).toBe(true);
  });

  test('infty', () => {
    const row = parse('\\infty');

    expect(util.isEqual(row, builders.row([builders.char('\u221E')]))).toBe(
      true,
    );
  });

  test('subsup with braces', () => {
    const row = parse('\\sum_{i=0}^{10}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('\u2211'),
          builders.subsup(
            [builders.char('i'), builders.char('='), builders.char('0')],
            [builders.char('1'), builders.char('0')],
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('delimiters with parens', () => {
    const row = parse('a+\\left(x-1\\right)-b');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.char('a'),
          builders.char('+'),
          builders.delimited(
            [builders.char('x'), builders.char('\u2212'), builders.char('1')],
            builders.char('('),
            builders.char(')'),
          ),
          builders.char('\u2212'),
          builders.char('b'),
        ]),
      ),
    ).toBe(true);
  });

  test('delimiters with brackets', () => {
    const row = parse('\\left[x-1\\right]');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.delimited(
            [builders.char('x'), builders.char('\u2212'), builders.char('1')],
            builders.char('['),
            builders.char(']'),
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('frac 1/x', () => {
    const row = parse('\\frac1x');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.frac([builders.char('1')], [builders.char('x')]),
        ]),
      ),
    ).toBe(true);
  });

  test('frac x/y', () => {
    const row = parse('\\frac xy');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.frac([builders.char('x')], [builders.char('y')]),
        ]),
      ),
    ).toBe(true);
  });

  test('frac with braces', () => {
    const row = parse('\\frac{x+1}{x-1}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.frac(
            [builders.char('x'), builders.char('+'), builders.char('1')],
            [builders.char('x'), builders.char('\u2212'), builders.char('1')],
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('\\sqrt x', () => {
    const row = parse('\\sqrt x');

    expect(
      util.isEqual(
        row,
        builders.row([builders.root(null, [builders.char('x')])]),
      ),
    ).toBe(true);
  });

  test('\\sqrt[n]x', () => {
    const row = parse('\\sqrt[n]x');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.root([builders.char('n')], [builders.char('x')]),
        ]),
      ),
    ).toBe(true);
  });

  test('\\sqrt{x+1}', () => {
    const row = parse('\\sqrt{x+1}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.root(null, [
            builders.char('x'),
            builders.char('+'),
            builders.char('1'),
          ]),
        ]),
      ),
    ).toBe(true);
  });

  test('\\sqrt[n-1]{x+1}', () => {
    const row = parse('\\sqrt[n-1]{x+1}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.root(
            [builders.char('n'), builders.char('\u2212'), builders.char('1')],
            [builders.char('x'), builders.char('+'), builders.char('1')],
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('\\vec{u}+\\hat v', () => {
    const row = parse('\\vec{u}+\\hat v');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.accent([builders.char('u')], AccentType.Vec),
          builders.char('+'),
          builders.accent([builders.char('v')], AccentType.Hat),
        ]),
      ),
    ).toBe(true);
  });

  test('bmatrix', () => {
    const row = parse('\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.matrix(
            [
              builders.row([builders.char('a')]),
              builders.row([builders.char('b')]),
              builders.row([builders.char('c')]),
              builders.row([builders.char('d')]),
            ],
            2,
            2,
            {
              left: builders.char('['),
              right: builders.char(']'),
            },
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('pmatrix', () => {
    const row = parse('\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}');

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.matrix(
            [
              builders.row([builders.char('a')]),
              builders.row([builders.char('b')]),
              builders.row([builders.char('c')]),
              builders.row([builders.char('d')]),
            ],
            2,
            2,
            {
              left: builders.char('('),
              right: builders.char(')'),
            },
          ),
        ]),
      ),
    ).toBe(true);
  });

  // TODO: test case for nested matrices

  test('matrix (inconsistent column count)', () => {
    expect(() => {
      parse('\\begin{bmatrix}a&b\\\\c\\end{bmatrix}');
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: inconsistent number of columns]`,
    );
  });

  test('matrix (missing \\end)', () => {
    expect(() =>
      parse('\\begin{bmatrix}a&b\\\\c&d'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: expected \\end]`);
  });

  test('matrix (mismatched begin/end)', () => {
    expect(() =>
      parse('\\begin{bmatrix}a&b\\\\c&d\\end{pmatrix}'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: mismatched begin/end]`);
  });

  test('matrix (unknown matrix type)', () => {
    expect(() =>
      parse('\\begin{kmatrix}a&b\\\\c&d\\end{kmatrix}'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: unknown matrix type]`);
  });

  test('unexpected rbrace', () => {
    expect(() => parse('}')).toThrowErrorMatchingInlineSnapshot(
      `[Error: unexpected rbrace]`,
    );
  });

  test('no right delimiter', () => {
    expect(() => parse('\\left(a+b')).toThrowErrorMatchingInlineSnapshot(
      `[Error: no right delimiter]`,
    );
  });

  test('unknown command', () => {
    expect(() => parse('\\foo')).toThrowErrorMatchingInlineSnapshot(
      `[Error: unknown command: foo]`,
    );
  });

  test('unexpected right delimiter', () => {
    expect(() => parse('\\right)')).toThrowErrorMatchingInlineSnapshot(
      `[Error: unexpected right delimiter]`,
    );
  });

  describe('bare delimiters', () => {
    const { row, char, delimited } = builders;

    test('(a) becomes a delimited node', () => {
      expect(
        util.isEqual(
          parse('(a)'),
          row([delimited([char('a')], char('('), char(')'))]),
        ),
      ).toBe(true);
    });

    test('nested parens', () => {
      expect(
        util.isEqual(
          parse('((a)b)'),
          row([
            delimited(
              [delimited([char('a')], char('('), char(')')), char('b')],
              char('('),
              char(')'),
            ),
          ]),
        ),
      ).toBe(true);
    });

    test('an unmatched paren stays a plain char', () => {
      expect(
        util.isEqual(
          parse('[0,1)'),
          row([char('['), char('0'), char(','), char('1'), char(')')]),
        ),
      ).toBe(true);
      expect(util.isEqual(parse('(a'), row([char('('), char('a')]))).toBe(true);
    });

    test('a paren group ends at the end of its enclosing group', () => {
      expect(
        util.isEqual(
          parse('\\frac{(a}{b)}'),
          row([builders.frac([char('('), char('a')], [char('b'), char(')')])]),
        ),
      ).toBe(true);
    });

    test('|x| becomes a delimited node', () => {
      expect(
        util.isEqual(
          parse('|x|'),
          row([delimited([char('x')], char('|'), char('|'))]),
        ),
      ).toBe(true);
    });

    test('a bar after an operator opens a new absolute value', () => {
      expect(
        util.isEqual(
          parse('|x|+|y|'),
          row([
            delimited([char('x')], char('|'), char('|')),
            char('+'),
            delimited([char('y')], char('|'), char('|')),
          ]),
        ),
      ).toBe(true);
    });

    test('many unmatched parens', () => {
      const input = '('.repeat(1000);
      expect(parse(input).children).toHaveLength(1000);
    });
  });

  describe('superscripts with a leading minus', () => {
    test('x^-2 is x^{-2}', () => {
      expect(
        util.isEqual(
          parse('x^-2'),
          builders.row([builders.char('x'), util.sup('−2')]),
        ),
      ).toBe(true);
    });

    test('x_-1', () => {
      expect(
        util.isEqual(
          parse('x_-1'),
          builders.row([builders.char('x'), util.sub('−1')]),
        ),
      ).toBe(true);
    });

    test('a missing superscript throws', () => {
      expect(() => parse('x^')).toThrowErrorMatchingInlineSnapshot(
        `[Error: expected a subscript or superscript]`,
      );
    });
  });

  test('\\div and \\ne', () => {
    expect(
      util.isEqual(
        parse('a\\div b\\ne c'),
        builders.row([
          builders.char('a'),
          builders.char('÷'),
          builders.char('b'),
          builders.char('≠'),
          builders.char('c'),
        ]),
      ),
    ).toBe(true);
  });

  test('trailing whitespace is ignored', () => {
    expect(util.isEqual(parse('x  '), builders.row([builders.char('x')]))).toBe(
      true,
    );
  });

  // https://github.com/math-blocks/math-blocks/issues/869
  test.each([
    ['\\cup', '\u222a'],
    ['\\cap', '\u2229'],
    ['\\emptyset', '\u2205'],
    ['\\ldots', '\u2026'],
    ['\\cdots', '\u22ef'],
    ['\\to', '\u2192'],
    ['\\approx', '\u2248'],
    ['\\perp', '\u22a5'],
    ['\\parallel', '\u2225'],
    ['\\circ', '\u2218'],
    ['\\{', '{'],
    ['\\}', '}'],
  ])('%s becomes the char %s', (tex, expected) => {
    expect(
      util.isEqual(parse(tex), builders.row([builders.char(expected)])),
    ).toBe(true);
  });
});
