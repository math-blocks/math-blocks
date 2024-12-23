import { builders, util, AccentType } from '@math-blocks/editor';

import { Parser } from '../parser';

describe('Parser', () => {
  test('subsup', () => {
    const parser = new Parser('\\int_0^1');
    const row = parser.parse();

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
    const parser = new Parser('a_n');
    const row = parser.parse();

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
    const parser = new Parser('\\lim_{x\\rightarrow0}');
    const row = parser.parse();

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
    const parser = new Parser('x^2y^2');
    const row = parser.parse();

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
    const parser = new Parser('a^{b^c}');
    const row = parser.parse();

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
    const parser = new Parser('\\infty');
    const row = parser.parse();

    expect(util.isEqual(row, builders.row([builders.char('\u221E')]))).toBe(
      true,
    );
  });

  test('subsup with braces', () => {
    const parser = new Parser('\\sum_{i=0}^{10}');
    const row = parser.parse();

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
    const parser = new Parser('\\left(x-1\\right)');
    const row = parser.parse();

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.delimited(
            [builders.char('x'), builders.char('-'), builders.char('1')],
            builders.char('('),
            builders.char(')'),
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('delimiters with brackets', () => {
    const parser = new Parser('\\left[x-1\\right]');
    const row = parser.parse();

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.delimited(
            [builders.char('x'), builders.char('-'), builders.char('1')],
            builders.char('['),
            builders.char(']'),
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('frac 1/x', () => {
    const parser = new Parser('\\frac1x');
    const row = parser.parse();

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
    const parser = new Parser('\\frac xy');
    const row = parser.parse();

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
    const parser = new Parser('\\frac{x+1}{x-1}');
    const row = parser.parse();

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.frac(
            [builders.char('x'), builders.char('+'), builders.char('1')],
            [builders.char('x'), builders.char('-'), builders.char('1')],
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('\\sqrt x', () => {
    const parser = new Parser('\\sqrt x');
    const row = parser.parse();

    expect(
      util.isEqual(
        row,
        builders.row([builders.root(null, [builders.char('x')])]),
      ),
    ).toBe(true);
  });

  test('\\sqrt[n]x', () => {
    const parser = new Parser('\\sqrt[n]x');
    const row = parser.parse();

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
    const parser = new Parser('\\sqrt{x+1}');
    const row = parser.parse();

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
    const parser = new Parser('\\sqrt[n-1]{x+1}');
    const row = parser.parse();

    expect(
      util.isEqual(
        row,
        builders.row([
          builders.root(
            [builders.char('n'), builders.char('-'), builders.char('1')],
            [builders.char('x'), builders.char('+'), builders.char('1')],
          ),
        ]),
      ),
    ).toBe(true);
  });

  test('\\vec{u}+\\hat v', () => {
    const parser = new Parser('\\vec{u}+\\hat v');
    const row = parser.parse();

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

  test('unexpected rbrace', () => {
    const parser = new Parser('}');

    expect(() => parser.parse()).toThrowErrorMatchingInlineSnapshot(
      `"unexpected rbrace"`,
    );
  });

  test('no right delimiter', () => {
    const parser = new Parser('\\left(a+b');

    expect(() => parser.parse()).toThrowErrorMatchingInlineSnapshot(
      `"no right delimiter"`,
    );
  });

  test('unknown command', () => {
    const parser = new Parser('\\foo');

    expect(() => parser.parse()).toThrowErrorMatchingInlineSnapshot(
      `"unknown command: foo"`,
    );
  });

  test('unexpected right delimiter', () => {
    const parser = new Parser('\\right)');

    expect(() => parser.parse()).toThrowErrorMatchingInlineSnapshot(
      `"unexpected right delimiter"`,
    );
  });
});
