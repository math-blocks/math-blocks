import * as Semantic from '@math-blocks/semantic';

import { parse, print } from '../../test-util';

import { factor } from '../factor';

const parsePolynomial = (input: string): Semantic.types.Add => {
  return parse(input) as Semantic.types.Add;
};

describe('factor', () => {
  test('x^2+5x+6', () => {
    const poly = parsePolynomial('x^2+5x+6');

    const result = factor(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x^{2}+5x+6",
        "x^{2}+3x+2x+6",
        "x(x+3)+2x+6",
        "x(x+3)+2(x+3)",
        "(x+2)(x+3)",
      ]
    `);
  });

  test('5', () => {
    const node = parse('5');

    const result = factor(node);

    expect(result).toBeUndefined();
  });
});
