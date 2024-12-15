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
  it('should divide both sides (variable on left)', () => {
    const before = parseNumRel('x^2 + 5x + 6 = 0');
    const result = transform(before);

    if (result.message !== 'solve quadratic') {
      throw new Error("expected step.message to be 'solve quadratic'");
    }

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
});
