import { types, builders } from '@math-blocks/semantic';

import { parse, print } from '../../test-util';
import type { Step } from '../../types';

import { solveQuadratic } from '../solve-quadratic';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

const printSteps = (result: Step): string[] => {
  return [
    print(result.before),
    ...result.substeps.map((step) => {
      const before = print(step.before);
      const after = print(step.after);
      return `${before} => ${after}`;
    }),
    print(result.after),
  ];
};

const transform = (
  node: types.NumericRelation,
  ident: types.Identifier,
): Step => {
  const result = solveQuadratic(node, ident);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('solveQuadtratic', () => {
  it('x^2 + 5x + 6 = 0', () => {
    const before = parseNumRel('x^2 + 5x + 6 = 0');
    const ident = builders.identifier('x');
    const result = transform(before, ident);

    expect(result.message).toEqual('solve quadratic');
    expect(printSteps(result)).toMatchInlineSnapshot(`
      [
        "x^2 + 5x + 6 = 0",
        "x^2 + 5x + 6 => (x + 2)(x + 3)",
        "(x + 2)(x + 3) = 0 => x + 2 = 0, x + 3 = 0",
        "x + 2 = 0 => x = -2",
        "x + 3 = 0 => x = -3",
        "x = -2, x = -3",
      ]
    `);
  });

  it('t^2 + 5t + 6 > 0', () => {
    const before = parseNumRel('t^2 + 5t + 6 > 0');
    const ident = builders.identifier('t');
    const result = transform(before, ident);

    expect(result.message).toEqual('solve quadratic');
    expect(printSteps(result)).toMatchInlineSnapshot(`
      [
        "t^2 + 5t + 6 > 0",
        "t^2 + 5t + 6 => (t + 2)(t + 3)",
        "(t + 2)(t + 3) = 0 => t + 2 > 0, t + 3 > 0",
        "t + 2 > 0 => t > -2",
        "t + 3 > 0 => t > -3",
        "t > -2, t > -3",
      ]
    `);
  });

  it('-3x^2 + 11x + 4 < 0', () => {
    const before = parseNumRel('-3x^2 + 11x + 4 < 0');
    const ident = builders.identifier('x');
    const result = transform(before, ident);

    expect(result.message).toEqual('solve quadratic');
    expect(printSteps(result)).toMatchInlineSnapshot(`
      [
        "-3x^2 + 11x + 4 < 0",
        "-3x^2 + 11x + 4 => (-3x - 1)(x - 4)",
        "(-3x - 1)(x - 4) = 0 => -3x - 1 < 0, x - 4 < 0",
        "-3x - 1 < 0 => x > 1 / -3",
        "x - 4 < 0 => x < 4",
        "x > 1 / -3, x < 4",
      ]
    `);
  });

  describe('bail-out cases', () => {
    it('5x = 0', () => {
      const node = parseNumRel('5x = 0');
      const ident = builders.identifier('x');

      const result = solveQuadratic(node, ident);

      expect(result).toBeUndefined();
    });

    // TODO: handle this case
    it('x^2 - 5x = 6', () => {
      const node = parseNumRel('x^2 - 5x = 6');
      const ident = builders.identifier('x');

      const result = solveQuadratic(node, ident);

      expect(result).toBeUndefined();
    });

    // TODO: handle this case
    it('x^2 - 5x = 0', () => {
      const node = parseNumRel('x^2 - 5x = 0');
      const ident = builders.identifier('x');

      const result = solveQuadratic(node, ident);

      expect(result).toBeUndefined();
    });
  });
});
