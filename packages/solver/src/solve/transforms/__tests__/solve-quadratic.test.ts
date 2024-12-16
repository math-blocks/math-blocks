import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { solveQuadratic } from '../solve-quadratic';

import type { Step } from '../../../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const transform = (node: Semantic.types.NumericRelation): Step => {
  const result = solveQuadratic(node);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('solveQuadtratic', () => {
  it('x^2 + 5x + 6 = 0', () => {
    const before = parseNumRel('x^2 + 5x + 6 = 0');
    const result = transform(before);

    expect(result.message).toEqual('solve quadratic');

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(steps).toMatchInlineSnapshot(`
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

  it('x^2 + 5x + 6 > 0', () => {
    const before = parseNumRel('x^2 + 5x + 6 > 0');
    const result = transform(before);

    expect(result.message).toEqual('solve quadratic');

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x^2 + 5x + 6 > 0",
        "x^2 + 5x + 6 => (x + 2)(x + 3)",
        "(x + 2)(x + 3) = 0 => x + 2 > 0, x + 3 > 0",
        "x + 2 > 0 => x > -2",
        "x + 3 > 0 => x > -3",
        "x > -2, x > -3",
      ]
    `);
  });

  it('-3x^2 + 11x + 4 < 0', () => {
    const before = parseNumRel('-3x^2 + 11x + 4 < 0');
    const result = transform(before);

    expect(result.message).toEqual('solve quadratic');

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(steps).toMatchInlineSnapshot(`
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

      const result = solveQuadratic(node);

      expect(result).toBeUndefined();
    });

    // TODO: handle this case
    it('x^2 - 5x = 6', () => {
      const node = parseNumRel('x^2 - 5x = 6');

      const result = solveQuadratic(node);

      expect(result).toBeUndefined();
    });

    // TODO: handle this case
    it('x^2 - 5x = 0', () => {
      const node = parseNumRel('x^2 - 5x = 0');

      const result = solveQuadratic(node);

      expect(result).toBeUndefined();
    });
  });
});
