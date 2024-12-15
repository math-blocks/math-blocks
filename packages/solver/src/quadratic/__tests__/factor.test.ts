import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { factor } from '../factor';
import { toHaveSubstepsLike, toHaveFullStepsLike } from '../../test-util';

expect.extend({ toHaveSubstepsLike, toHaveFullStepsLike });

const parsePolynomial = (input: string): Semantic.types.Add => {
  return Testing.parse(input) as Semantic.types.Add;
};

describe('factor', () => {
  test('x^2 + 5x + 6', () => {
    const poly = parsePolynomial('x^2 + 5x + 6');

    const result = factor(poly);
    if (!result) {
      throw new Error('expected result');
    }

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => Testing.print(step.after)),
    ];

    // TODO: include the message in the snapshot
    expect(steps).toMatchInlineSnapshot(`
      [
        "x^2 + 5x + 6",
        "x^2 + 3x + 2x + 6",
        "x(x + 3) + 2x + 6",
        "x(x + 3) + 2(x + 3)",
        "(x + 2)(x + 3)",
      ]
    `);
  });

  test('x^2 + x - 6', () => {
    const poly = parsePolynomial('x^2 + x - 6');

    const result = factor(poly);
    if (!result) {
      throw new Error('expected result');
    }

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => Testing.print(step.after)),
    ];

    // TODO: include the message in the snapshot
    expect(steps).toMatchInlineSnapshot(`
      [
        "x^2 + x - 6",
        "x^2 + 3x - 2x - 6",
        "x(x + 3) - 2x - 6",
        "x(x + 3) - 2(x + 3)",
        "(x - 2)(x + 3)",
      ]
    `);
  });

  test('w^4 + 5w^2 + 6', () => {
    const poly = parsePolynomial('w^4 + 5w^2 + 6');

    const result = factor(poly);
    if (!result) {
      throw new Error('expected result');
    }

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => Testing.print(step.after)),
    ];

    // TODO: include the message in the snapshot
    expect(steps).toMatchInlineSnapshot(`
      [
        "w^4 + 5w^2 + 6",
        "w^4 + 3w^2 + 2w^2 + 6",
        "w^2(w^2 + 3) + 2w^2 + 6",
        "w^2(w^2 + 3) + 2(w^2 + 3)",
        "(w^2 + 2)(w^2 + 3)",
      ]
    `);
  });
});
