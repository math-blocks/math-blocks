import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { simplify as _simplify } from '../simplify';

import { applyStep, applySteps } from '../../apply';
import type { Step } from '../../types';
import { toHaveFullStepsLike } from '../../test-util';

expect.extend({ toHaveFullStepsLike });

const simplify = (node: Semantic.types.Node): Step => {
  if (!Semantic.util.isNumeric(node)) {
    throw new Error('node is not a NumericNode');
  }
  const result = _simplify(node);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('simplify', () => {
  describe('collect like terms', () => {
    test('3x + 4x -> 7x', () => {
      const ast = Testing.parse('3x + 4x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('7x');
    });

    test('x + 3x -> 4x', () => {
      const ast = Testing.parse('x + 3x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('4x');

      expect(ast).toHaveFullStepsLike({
        steps: step.substeps,
        expressions: ['x + 3x', '4x'],
      });
    });

    test('-x + 3x -> 2x', () => {
      const ast = Testing.parse('-x + 3x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('2x');
    });

    // Shows that we drop the `1` in `-1x`
    test('x - 2x -> -x', () => {
      const ast = Testing.parse('x - 2x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('-x');
    });

    // Shows that we convert additive inverse to subtraction where possible
    test('a + x - 2x -> a - x', () => {
      const ast = Testing.parse('a + x - 2x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('a - x');
    });

    // Shows that we convert additive inverse to subtraction where possible
    test('a + 2x - 5x -> a - 3x', () => {
      const ast = Testing.parse('a + 2x - 5x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('a - 3x');
    });

    // TODO: add transform that converts (neg (mul 2 x)) to (mul (neg 2 x))
    // or update how deal directly with the first and then add a transform that
    // converts (mul (neg 2) x) to (neg (mul 2 x)).  The second option seems easier.
    test('2x - (-3)(x) -> 5x', () => {
      const ast = Testing.parse('2x - (-3)(x)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('5x');

      const first = applyStep(ast, step.substeps[0]);
      const second = applyStep(first, step.substeps[1]);
      expect(Testing.print(first)).toEqual('2x - -3x');
      expect(Testing.print(second)).toEqual('5x');
    });

    test('2x - -3x -> 5x', () => {
      const ast = Testing.parse('2x - -3x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('5x');
    });

    test('5x + -3x -> 2x', () => {
      const ast = Testing.parse('5x + -3x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('2x');
    });

    test('4x + -3x - 1 -> 7x - 1', () => {
      const ast = Testing.parse('4x + -3x - 1');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x - 1');
    });

    test('4x - 3x - 1 -> 7x - 1', () => {
      const ast = Testing.parse('4x - 3x - 1');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x - 1');
    });

    test('x/2 + x/2 -> x', () => {
      const ast = Testing.parse('x/2 + x/2');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x');
    });

    test('x/2 - x/3 -> x / 6', () => {
      const ast = Testing.parse('x/2 - x/3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
        'multiply fraction(s)',
        'simplify multiplication',
      ]);
      expect(Testing.print(step.after)).toEqual('x / 6');
    });

    test('x/2 + x/-3 -> x', () => {
      const ast = Testing.parse('x/2 + x/-3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
        'multiply fraction(s)',
        'simplify multiplication',
      ]);
      expect(Testing.print(step.after)).toEqual('x / 6');
    });

    test('x/-2 + x/3 -> x', () => {
      const ast = Testing.parse('x/-2 + x/3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
        'multiply fraction(s)',
        'simplify multiplication',
      ]);
      expect(Testing.print(step.after)).toEqual('-(x / 6)');

      expect(ast).toHaveFullStepsLike({
        steps: step.substeps,
        expressions: ['x / -2 + x / 3', '-(1 / 6)(x)', '-(1x / 6)', '-(x / 6)'],
      });
    });

    test('2xy + 3xy -> 5xy', () => {
      const ast = Testing.parse('2xy + 3xy');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('5xy');
    });

    test('1x -> x', () => {
      const ast = Testing.parse('1x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication', // Don't elide this step
      ]);
      expect(Testing.print(step.after)).toEqual('x');
    });

    test('-1x -> -x', () => {
      const ast = Testing.parse('-1x');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication', // Don't elide this step
      ]);
      expect(Testing.print(step.after)).toEqual('-x');
    });

    test('x/2 + x/3 -> x', () => {
      const ast = Testing.parse('x/2 + x/3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
        'multiply fraction(s)',
      ]);
      expect(Testing.print(step.after)).toEqual('5x / 6');
    });

    test('x + 1 + 4 -> x + 5', () => {
      const ast = Testing.parse('x + 1 + 4');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x + 5');
    });

    // drop parens
    test('(x + 1) + 4 -> x + 5', () => {
      const ast = Testing.parse('(x + 1) + 4');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'drop parentheses',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x + 5');
    });

    test('3 - 1x - 1 -> -x + 2', () => {
      const ast = Testing.parse('3 - 1x - 1');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication',
        'collect like terms',
      ]);

      expect(Testing.print(step.after)).toEqual('2 - x');
    });

    test('1 - (2x + 3x) -> 1 - 5x', () => {
      const ast = Testing.parse('1 - (2x + 3x)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('1 - 5x');
    });

    test('1 - (2x + 3x + 4y) -> 1 - 5x + 4y', () => {
      const ast = Testing.parse('1 - (2x + 3x + 4y)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'collect like terms',
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('1 - 5x - 4y');
    });
  });

  describe('distribution', () => {
    test('3(x + 1) + 4 -> 3x + 7', () => {
      const ast = Testing.parse('3(x + 1) + 4');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('3x + 7');
    });

    test('3(x + 1) -> 3x + 3', () => {
      const ast = Testing.parse('3(x + 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('3x + 3');

      expect(step.substeps[0].substeps.map((step) => step.message)).toEqual([
        'multiply each term',
        'multiply monomials',
      ]);
    });

    test('3(x + y + z) -> 3x + 3y + 3z', () => {
      const ast = Testing.parse('3(x + y + z)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('3x + 3y + 3z');
    });

    test('(-2)(x - 3) -> -2x + 6', () => {
      const ast = Testing.parse('(-2)(x - 3)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('-2x + 6');
    });

    test('(1 + 2)(x + 1) -> 3x + 3', () => {
      const ast = Testing.parse('(1 + 2)(x + 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate addition',
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('3x + 3');
    });

    test('(6 * 1/2)(x + 1) -> 3x + 3', () => {
      const ast = Testing.parse('(6 * 1/2)(x + 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate multiplication',
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('3x + 3');
    });

    test('3 - (x + 1) -> -x + 2', () => {
      const ast = Testing.parse('3 - (x + 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'collect like terms',
      ]);
      expect(Testing.print(step.substeps[0].after)).toEqual('3 - x - 1');
      expect(Testing.print(step.after)).toEqual('2 - x');

      expect(
        step.substeps[0].substeps.map((substep) => substep.message),
      ).toEqual([
        'negation is the same as multipyling by one',
        'multiply each term',
        'multiplying a negative by a positive is negative',
        'multiplying a negative by a positive is negative',
        'adding the negative is the same as subtraction',
        'adding the negative is the same as subtraction',
      ]);
      expect(Testing.print(step.substeps[0].substeps[0].before)).toEqual(
        '-(x + 1)',
      );
      expect(Testing.print(step.substeps[0].substeps[0].after)).toEqual(
        '-1(x + 1)',
      );
      expect(Testing.print(step.substeps[0].substeps[1].before)).toEqual(
        '-1(x + 1)',
      );
      expect(Testing.print(step.substeps[0].substeps[1].after)).toEqual(
        '-1x + (-1)(1)',
      );
      expect(Testing.print(step.substeps[0].substeps[2].before)).toEqual('-1x');
      expect(Testing.print(step.substeps[0].substeps[2].after)).toEqual('-x');

      const first = applyStep(ast, step.substeps[0].substeps[0]);
      const second = applyStep(first, step.substeps[0].substeps[1]);
      expect(Testing.print(first)).toEqual('3 + -1(x + 1)');
      expect(Testing.print(second)).toEqual('3 + -1x + (-1)(1)');
      // ... and so on.
    });

    test('3(x + 2(x - 1)) -> 3(3x - 2) -> 9x - 6', () => {
      const ast = Testing.parse('3(x + 2(x - 1))');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'collect like terms',
        'distribute',
      ]);
      expect(
        step.substeps[2].substeps.map((substep) => substep.message),
      ).toEqual([
        'subtraction is the same as adding the negative',
        'multiply each term',
        'multiply monomials',
        'multiplying a negative by a positive is negative',
        'adding the negative is the same as subtraction',
      ]);
      expect(Testing.print(step.after)).toEqual('9x - 6');
    });

    test('(ab)(xy - yz)', () => {
      const ast = Testing.parse('(ab)(xy - yz)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('abxy - abyz');
    });

    test('(-ab)(xy - yz)', () => {
      const ast = Testing.parse('(-ab)(xy - yz)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('-abxy + abyz');

      expect(
        step.substeps[0].substeps.map((substep) => substep.message),
      ).toEqual([
        'subtraction is the same as adding the negative',
        'multiply each term',
        'multiplying a negative by a positive is negative',
        'multiplying two negatives is a positive',
      ]);
    });

    test('(3)(3)(x) - 6 -> 9x - 6', () => {
      const ast = Testing.parse('(3)(3)(x) - 6');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate multiplication',
      ]);
      expect(Testing.print(step.after)).toEqual('9x - 6');
    });

    test('3(x + 1) + 4(x - 1) -> 7x - 1', () => {
      const ast = Testing.parse('3(x + 1) + 4(x - 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'distribute',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('7x - 1');
    });

    test('3x + (3)(1) + 4x + (4)(-1)', () => {
      const ast = Testing.parse('3x + (3)(1) + 4x + (4)(-1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication',
        'simplify multiplication',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('7x - 1');
    });

    test('3(x + 1) - (2x + 5) -> x - 2', () => {
      const ast = Testing.parse('3(x + 1) - (2x + 5)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'distribute',
        'collect like terms',
      ]);
      expect(Testing.print(step.after)).toEqual('x - 2');
    });

    test('x(x + 1) -> x^2 + x', () => {
      const ast = Testing.parse('x(x + 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'repeated multiplication can be written as a power',
      ]);
      expect(Testing.print(step.after)).toEqual('x^2 + x');

      expect(
        step.substeps[0].substeps.map((substep) => substep.message),
      ).toEqual(['multiply each term', 'multiply monomials']);
    });

    test('x(x - 1) -> x^2 - x', () => {
      const ast = Testing.parse('x(x - 1)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'repeated multiplication can be written as a power',
      ]);
      expect(Testing.print(step.after)).toEqual('x^2 - x');

      expect(
        step.substeps[0].substeps.map((substep) => substep.message),
      ).toEqual([
        'subtraction is the same as adding the negative',
        'multiply each term',
        'multiplying a negative by a positive is negative',
        'adding the negative is the same as subtraction',
      ]);
    });

    test('(x + 1)(x + 3) -> x^2 + 4x + 3', () => {
      const ast = Testing.parse('(x + 1)(x + 3)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'distribute',
        'distribute',
        'distribute',
        'collect like terms',
        'repeated multiplication can be written as a power',
      ]);
      expect(Testing.print(step.after)).toEqual('x^2 + 4x + 3');

      const first = applyStep(ast, step.substeps[0]);
      expect(Testing.print(first)).toEqual('(x + 1)x + 3(x + 1)'); // is the 3 at the front?
      const second = applyStep(first, step.substeps[1]);
      expect(Testing.print(second)).toEqual('xx + x + 3(x + 1)');
      const third = applyStep(second, step.substeps[2]);
      expect(Testing.print(third)).toEqual('xx + x + 3x + 3');
      const fourth = applyStep(third, step.substeps[3]);
      expect(Testing.print(fourth)).toEqual('xx + 4x + 3');
      const fifth = applyStep(fourth, step.substeps[4]);
      expect(Testing.print(fifth)).toEqual('x^2 + 4x + 3');
    });

    test.skip('(x + 1)^2 -> x^2 + 2x + 1', () => {
      const ast = Testing.parse('(x + 1)^2');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate addition',
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('x^2 + 2x + 1');
    });
  });

  describe('powers', () => {
    test('(x)(x) -> x^2', () => {
      const ast = Testing.parse('(x)(x)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'repeated multiplication can be written as a power',
      ]);
      expect(Testing.print(step.after)).toEqual('x^2');
    });

    test('(3)(3) -> 9', () => {
      const ast = Testing.parse('(3)(3)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate multiplication',
      ]);
      expect(Testing.print(step.after)).toEqual('9');
    });

    test('banana -> ba^3n^2', () => {
      const ast = Testing.parse('banana');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'repeated multiplication can be written as a power',
      ]);
      expect(Testing.print(step.after)).toEqual('ba^3n^2');
    });

    test.skip('(a^2)(a^3) -> a^5', () => {
      const ast = Testing.parse('(a^2)(a^3)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate addition',
        'distribute',
      ]);
      expect(Testing.print(step.after)).toEqual('a^5');
    });
  });

  describe('reduce fraction', () => {
    test('abc / bc -> a', () => {
      const ast = Testing.parse('abc / bc');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('a');
    });

    test('ab / abc -> 1 / c', () => {
      const ast = Testing.parse('ab / abc');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('1 / c');
    });

    test('abc / bcd -> a / d', () => {
      const ast = Testing.parse('abc / bcd');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('a / d');
    });

    test('-abc / bcd -> -a / d', () => {
      const ast = Testing.parse('-abc / bcd');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('-a / d');
    });

    test('abc / -bcd -> a / -d', () => {
      const ast = Testing.parse('abc / -bcd');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('a / -d');
    });

    test('abc / abc -> 1', () => {
      const ast = Testing.parse('abc / abc');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('1');
    });

    test('-a / -1', () => {
      const ast = Testing.parse('-a / -1');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('a');
    });

    test('a / -1', () => {
      const ast = Testing.parse('a / -1');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('-a');
    });

    test('-ab / ab', () => {
      const ast = Testing.parse('-ab / ab');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('-1');
    });

    test('ab / -ab', () => {
      const ast = Testing.parse('ab / -ab');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('-1');
    });

    test('(-a)(b)(c) / b', () => {
      const ast = Testing.parse('(-a)(b)(c) / b');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication', // TODO: elide this step
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('-ac');

      expect(ast).toHaveFullStepsLike({
        steps: step.substeps,
        expressions: [
          '-abc / b',
          '-abc / b', // TODO: elide this step
          '-ac',
        ],
      });
    });
  });

  describe('evaluate division', () => {
    test('4/6 -> 2/3', () => {
      const ast = Testing.parse('4 / 6');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate division',
      ]);
      expect(Testing.print(step.after)).toEqual('2 / 3');
    });

    test('-(4/6) -> -(2/3)', () => {
      const ast = Testing.parse('-(4/6)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate division',
      ]);
      expect(Testing.print(step.after)).toEqual('-(2 / 3)');
    });

    test.skip('-4/6 -> -2/3', () => {
      const ast = Testing.parse('-4/6');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate division',
      ]);
      // TODO: if the numerator or denominator was signed to begin with
      // keep it that way instead of making the entire fraction signed.
      expect(Testing.print(step.after)).toEqual('-2 / 3');
    });

    test('2/3 cannot be simplified', () => {
      const ast = Testing.parse('2 / 3');

      expect(() => simplify(ast)).toThrowError();
    });

    test('2x / 2 -> x', () => {
      const ast = Testing.parse('2x / 2');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'reduce fraction',
      ]);
      expect(Testing.print(step.after)).toEqual('x');
    });
  });

  describe('numeric fractions', () => {
    test('1 / 2 + 1 / 3', () => {
      const ast = Testing.parse('1 / 2 + 1 / 3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate addition',
      ]);
      expect(Testing.print(step.after)).toEqual('5 / 6');
    });

    test('1 / 2 - 1 / 3', () => {
      const ast = Testing.parse('1 / 2 - 1 / 3');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'evaluate addition',
      ]);
      expect(Testing.print(step.after)).toEqual('1 / 6');
    });

    test('-(1 / 6) * 6', () => {
      const ast = Testing.parse('-(1 / 6) * 6');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(Testing.print(step.after)).toEqual('-1');
      expect(Testing.print(applySteps(ast, step.substeps))).toEqual('-1');

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'simplify multiplication', // TODO: elide this step
        'evaluate multiplication',
      ]);

      expect(ast).toHaveFullStepsLike({
        steps: step.substeps,
        expressions: [
          '-(1 / 6) * 6',
          '-(1 / 6 * 6)', // TODO: elide this step
          '-1',
        ],
      });
    });
  });

  describe('addition of negative is subtraction', () => {
    test('a + -b', () => {
      const ast = Testing.parse('a + -b');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'adding the inverse is the same as subtraction',
      ]);
      expect(Testing.print(step.after)).toEqual('a - b');
    });
  });

  describe('adding/subtracting zero', () => {
    test('a + 0', () => {
      const ast = Testing.parse('a + 0');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'drop adding zero (additive identity)',
      ]);
      expect(Testing.print(step.after)).toEqual('a');
    });

    test('a + 0 + b', () => {
      const ast = Testing.parse('a + 0 + b');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'drop adding zero (additive identity)',
      ]);
      expect(Testing.print(step.after)).toEqual('a + b');
    });

    test('a - 0', () => {
      const ast = Testing.parse('a - 0');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'drop adding zero (additive identity)',
      ]);
      expect(Testing.print(step.after)).toEqual('a');
    });

    test('0 - a', () => {
      const ast = Testing.parse('0 - a');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'drop adding zero (additive identity)',
      ]);
      expect(Testing.print(step.after)).toEqual('-a');
    });
  });

  describe('multiplication by zero', () => {
    test('(a)(0)', () => {
      const ast = Testing.parse('(a)(0)');

      const step = simplify(ast);

      expect(step.message).toEqual('simplify expression');
      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'multiplying by zero is equivalent to zero',
      ]);
      expect(Testing.print(step.after)).toEqual('0');
    });
  });
});
