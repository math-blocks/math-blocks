import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { factor } from '../factor';

const parsePolynomial = (input: string): Semantic.types.Add => {
  return Testing.parse(input) as Semantic.types.Add;
};

describe('factor', () => {
  test('x^2 + 5x + 6', () => {
    const poly = parsePolynomial('x^2 + 5x + 6');

    const result = factor(poly)!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => Testing.print(step.after)),
    ];

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

  test('5', () => {
    const node = Testing.parse('5');

    const result = factor(node);

    expect(result).toBeUndefined();
  });
});
