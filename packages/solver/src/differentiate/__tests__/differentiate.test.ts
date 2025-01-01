import { Step } from '../../types';
import * as Testing from '../../test-util';

import { differentiate } from '../differentiate';

const printSteps = (result: Step): string[] => {
  return [
    Testing.print(result.before),
    ...result.substeps.map(
      (step) => `${Testing.print(step.after)} - ${step.message}`,
    ),
  ];
};

describe('differentiate', () => {
  describe('power rule', () => {
    test('x^3', () => {
      const node = Testing.parse('x^3');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x^3",
          "3x^(3 - 1) - power rule",
          "3x^2 - simplify expression",
        ]
      `);
    });

    test('x^n', () => {
      const node = Testing.parse('x^n');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x^n",
          "nx^(n - 1) - power rule",
        ]
      `);
    });

    test('x^2 + x', () => {
      const node = Testing.parse('x^2 + x');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x^2 + x",
          "2x + 1 - differentiate",
        ]
      `);
      expect(printSteps(result.substeps[0])).toMatchInlineSnapshot(`
        [
          "x^2 + x",
          "2x - differentiate",
          "1 - differentiate",
        ]
      `);
    });

    test('x^-1', () => {
      const node = Testing.parse('x^-1');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x^(-1)",
          "-1x^(-1 - 1) - power rule",
          "-x^(-2) - simplify expression",
        ]
      `);
    });

    test('-x', () => {
      const node = Testing.parse('-x');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "-x",
          "-1 - differentiate",
        ]
      `);
    });

    test('3x^2', () => {
      const node = Testing.parse('3x^2');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "3x^2",
          "3(2x) - differentiate",
        ]
      `);
    });

    test('(x^2)(3)', () => {
      const node = Testing.parse('(x^2)(3)');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "(x^2)(3)",
          "3(2x) - differentiate",
        ]
      `);
    });

    test('x + 1', () => {
      const node = Testing.parse('x + 1');
      const result = differentiate(node)!;
      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x + 1",
          "1 - differentiate",
        ]
      `);
    });
  });

  describe('exponential functions', () => {
    test('e^x', () => {
      const node = Testing.parse('e^x');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "e^x",
          "1e^x - chain rule",
          "e^x - simplify expression",
        ]
      `);
    });

    test('e^(-x)', () => {
      const node = Testing.parse('e^(-x)');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "e^(-x)",
          "-1e^(-x) - chain rule",
          "-e^(-x) - simplify expression",
        ]
      `);
    });

    test('e^(x^2)', () => {
      const node = Testing.parse('e^(x^2)');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "e^(x^2)",
          "(2x)e^(x^2) - chain rule",
        ]
      `);
    });
  });

  describe('product rule', () => {
    test('xe^x', () => {
      const node = Testing.parse('xe^x');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "xe^x",
          "e^x + xe^x - product rule",
        ]
      `);
    });
  });

  describe('quotient rule', () => {
    test('x/(1+x)', () => {
      const node = Testing.parse('x/(1+x)');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "x / (1 + x)",
          "(1(1 + x) - (x)(1)) / (1 + x)^2 - quotient rule",
          "1 / (1 + x)^2 - simplify expression",
        ]
      `);
    });

    test('(1+x)/1', () => {
      const node = Testing.parse('(1+x)/1');
      const result = differentiate(node)!;

      expect(printSteps(result)).toMatchInlineSnapshot(`
        [
          "(1 + x) / 1",
          "1 / 1 - differentiate",
          "1^0 - simplify expression",
        ]
      `);
    });
  });

  describe.skip('trig functions', () => {});
});
