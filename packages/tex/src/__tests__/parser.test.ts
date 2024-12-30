import { builders, util, AccentType } from '@math-blocks/editor';

import { parse } from '../parser';

describe('Parser', () => {
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
    const row = parse('\\left(x-1\\right)');

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
    const row = parse('\\left[x-1\\right]');

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
            [builders.char('x'), builders.char('-'), builders.char('1')],
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
            [builders.char('n'), builders.char('-'), builders.char('1')],
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

  test('unexpected rbrace', () => {
    expect(() => parse('}')).toThrowErrorMatchingInlineSnapshot(
      `"unexpected rbrace"`,
    );
  });

  test('no right delimiter', () => {
    expect(() => parse('\\left(a+b')).toThrowErrorMatchingInlineSnapshot(
      `"no right delimiter"`,
    );
  });

  test('unknown command', () => {
    expect(() => parse('\\foo')).toThrowErrorMatchingInlineSnapshot(
      `"unknown command: foo"`,
    );
  });

  test('unexpected right delimiter', () => {
    expect(() => parse('\\right)')).toThrowErrorMatchingInlineSnapshot(
      `"unexpected right delimiter"`,
    );
  });
});
