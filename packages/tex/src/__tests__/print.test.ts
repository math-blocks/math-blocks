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
});
