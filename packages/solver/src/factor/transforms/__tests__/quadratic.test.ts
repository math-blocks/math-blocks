import * as Semantic from '@math-blocks/semantic';

import { parse, print } from '../../../test-util';

import { factorQuadratic } from '../quadratic';

const parsePolynomial = (input: string): Semantic.types.Add => {
  return parse(input) as Semantic.types.Add;
};

describe('quadratic', () => {
  test('x^2+5x+6', () => {
    const poly = parsePolynomial('x^2+5x+6');

    const result = factorQuadratic(poly)!;

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

  test('5x+x^2+6', () => {
    const poly = parsePolynomial('5x+x^2+6');

    const result = factorQuadratic(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    // TODO: add an explicit reordering step
    expect(steps).toMatchInlineSnapshot(`
      [
        "5x+x^{2}+6",
        "x^{2}+3x+2x+6",
        "x(x+3)+2x+6",
        "x(x+3)+2(x+3)",
        "(x+2)(x+3)",
      ]
    `);
  });

  test('x^2+x-6', () => {
    const poly = parsePolynomial('x^2+x-6');

    const result = factorQuadratic(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x^{2}+x-6",
        "x^{2}+3x-2x-6",
        "x(x+3)-2x-6",
        "x(x+3)-2(x+3)",
        "(x-2)(x+3)",
      ]
    `);
  });

  test('w^4+5w^2+6', () => {
    const poly = parsePolynomial('w^4+5w^2+6');

    const result = factorQuadratic(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "w^{4}+5w^{2}+6",
        "w^{4}+3w^{2}+2w^{2}+6",
        "w^{2}(w^{2}+3)+2w^{2}+6",
        "w^{2}(w^{2}+3)+2(w^{2}+3)",
        "(w^{2}+2)(w^{2}+3)",
      ]
    `);
  });

  test('3x^2+11x-4', () => {
    const poly = parsePolynomial('3x^2+11x-4');

    const result = factorQuadratic(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "3x^{2}+11x-4",
        "3x^{2}+12x-x-4",
        "(3x)(x+4)-x-4",
        "(3x)(x+4)-(x+4)",
        "(3x-1)(x+4)",
      ]
    `);
  });

  test('-3x^2+11x+4', () => {
    const poly = parsePolynomial('-3x^2+11x+4');

    const result = factorQuadratic(poly)!;

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => print(step.after)),
    ];

    // TODO: factor out a `-1` from `(-3x - 1)`
    expect(steps).toMatchInlineSnapshot(`
      [
        "-3x^{2}+11x+4",
        "-3x^{2}+12x-x+4",
        "-(3x)(x-4)-x+4",
        "-(3x)(x-4)-(x-4)",
        "(-3x-1)(x-4)",
      ]
    `);
  });

  describe('bail-out modes', () => {
    test('x^2+2x (not a trinomial)', () => {
      const poly = parsePolynomial('x^2+2x');

      const result = factorQuadratic(poly);

      expect(result).toBe(undefined);
    });

    test('x^3+2x+1 (not quadratic)', () => {
      const poly = parsePolynomial('x^3+2x+1');

      const result = factorQuadratic(poly);

      expect(result).toBe(undefined);
    });

    test('x^2+x+1 (no real answers)', () => {
      const poly = parsePolynomial('x^2+x+1');

      const result = factorQuadratic(poly);

      expect(result).toBe(undefined);
    });
  });
});
