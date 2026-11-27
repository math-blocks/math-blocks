import { builders, AccentType } from '@math-blocks/editor';

import { print } from '../printer';

describe('print', () => {
  test('subsup', () => {
    const output = print(
      builders.row([
        builders.char('\u222b'),
        builders.subsup([builders.char('0')], [builders.char('1')]),
      ]),
    );

    expect(output).toEqual('\\int_{0}^{1}');
  });

  test('sub', () => {
    const output = print(
      builders.row([builders.char('a'), builders.subsup([builders.char('n')])]),
    );

    expect(output).toEqual('a_{n}');
  });

  test('sup', () => {
    const output = print(
      builders.row([
        builders.char('x'),
        builders.subsup(undefined, [builders.char('2')]),
        builders.char('y'),
        builders.subsup(undefined, [builders.char('2')]),
      ]),
    );

    expect(output).toEqual('x^{2}y^{2}');
  });

  test('sup (nested)', () => {
    const output = print(
      builders.row([
        builders.char('a'),
        builders.subsup(undefined, [
          builders.char('b'),
          builders.subsup(undefined, [builders.char('c')]),
        ]),
      ]),
    );

    expect(output).toEqual('a^{b^{c}}');
  });

  test('limits', () => {
    const output = print(
      builders.limits(
        builders.row([builders.char('lim')]),
        [builders.char('x'), builders.char('\u2192'), builders.char('0')],
        undefined,
      ),
    );

    expect(output).toEqual('\\lim_{x\\rightarrow0}');
  });

  test('delimiters', () => {
    const output = print(
      builders.row([
        builders.delimited(
          [builders.char('x'), builders.char('-'), builders.char('1')],
          builders.char('('),
          builders.char(')'),
        ),
      ]),
    );

    expect(output).toEqual('\\left(x-1\\right)');
  });

  test('frac', () => {
    const output = print(
      builders.row([builders.frac([builders.char('x')], [builders.char('y')])]),
    );

    expect(output).toEqual('\\frac{x}{y}');
  });

  test('sqrt', () => {
    const output = print(
      builders.row([builders.root(null, [builders.char('x')])]),
    );

    expect(output).toEqual('\\sqrt{x}');
  });

  test('nth-root', () => {
    const output = print(
      builders.row([builders.root([builders.char('n')], [builders.char('x')])]),
    );

    expect(output).toEqual('\\sqrt[n]{x}');
  });

  test('accents', () => {
    const output = print(
      builders.row([
        builders.accent([builders.char('u')], AccentType.Vec),
        builders.char('+'),
        builders.accent([builders.char('v')], AccentType.Hat),
      ]),
    );

    expect(output).toEqual('\\vec{u}+\\hat{v}');
  });

  test('macro', () => {
    const output = print(
      builders.row([
        builders.macro([
          builders.char('\\'),
          builders.char('s'),
          builders.char('i'),
          builders.char('n'),
        ]),
      ]),
    );

    expect(output).toEqual('\\sin');
  });

  describe('command names', () => {
    test('a letter after a command name is separated by a space', () => {
      const output = print(
        builders.row([
          builders.char('x'),
          builders.char('>'),
          builders.char('y'),
          builders.char('≤'),
          builders.char('π'),
          builders.char('r'),
        ]),
      );

      expect(output).toEqual('x\\gt y\\leq\\pi r');
    });

    test('a digit or symbol after a command name is not separated', () => {
      const output = print(
        builders.row([
          builders.char('x'),
          builders.char('<'),
          builders.char('3'),
          builders.char('⋅'),
          builders.char('('),
        ]),
      );

      expect(output).toEqual('x\\lt3\\cdot(');
    });

    test('a letter after a nested row ending in a command', () => {
      const output = print(
        builders.row([
          builders.char('2'),
          builders.row([builders.char('π')]),
          builders.char('r'),
        ]),
      );

      expect(output).toEqual('2\\pi r');
    });
  });

  test('\\div and \\neq', () => {
    const output = print(
      builders.row([
        builders.char('a'),
        builders.char('÷'),
        builders.char('b'),
        builders.char('≠'),
        builders.char('c'),
      ]),
    );

    expect(output).toEqual('a\\div b\\neq c');
  });

  test('absolute value', () => {
    const output = print(
      builders.row([
        builders.delimited(
          [builders.char('x')],
          builders.char('|'),
          builders.char('|'),
        ),
      ]),
    );

    expect(output).toEqual('\\left|x\\right|');
  });

  // https://github.com/math-blocks/math-blocks/issues/869
  test.each([
    ['\u222a', '\\cup'],
    ['\u2229', '\\cap'],
    ['\u2205', '\\emptyset'],
    ['\u2026', '\\ldots'],
    ['\u22ef', '\\cdots'],
    // `\to` is a synonym, but `\rightarrow` is printed.
    ['\u2192', '\\rightarrow'],
    ['{', '\\{'],
    ['}', '\\}'],
  ])('%s prints as %s', (char, expected) => {
    expect(print(builders.row([builders.char(char)]))).toEqual(expected);
  });
});
