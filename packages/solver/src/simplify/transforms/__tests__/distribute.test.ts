import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { applySteps } from '../../../apply';
import type { Step } from '../../../types';
import { distribute as _distribute } from '../distribute';

import { toHaveSubstepsLike, toHaveFullStepsLike } from '../../../test-util';

expect.extend({ toHaveSubstepsLike, toHaveFullStepsLike });

const distribute = (node: Semantic.types.Node): Step => {
  if (!Semantic.util.isNumeric(node)) {
    throw new Error('node is not a NumericNode');
  }
  const result = _distribute(node, []);
  if (!result) {
    throw new Error('no step returned');
  }
  return result;
};

describe('distribution', () => {
  test('a(b + c) -> ab + ac', () => {
    const ast = Testing.parse('a(b + c)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('ab + ac');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('ab + ac');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('x + a(b + c) -> x + ab + ac', () => {
    const ast = Testing.parse('x + a(b + c)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('x + ab + ac');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual(
      'x + ab + ac',
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('3(x + 1) -> 3x + 3', () => {
    const ast = Testing.parse('3(x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x + 3');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('3x + 3');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);
    expect(step).toHaveSubstepsLike([
      ['3(x + 1)', '3x + (3)(1)'],
      ['(3)(1)', '3'],
    ]);
  });

  test('(x + 1)(3) -> 3x + 3', () => {
    const ast = Testing.parse('(x + 1)(3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x + 3');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('3x + 3');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
      'multiply monomials',
    ]);
    expect(step).toHaveSubstepsLike([
      ['(x + 1)(3)', '(x)(3) + (1)(3)'],
      ['(x)(3)', '3x'],
      ['(1)(3)', '3'],
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: ['(x + 1)(3)', '(x)(3) + (1)(3)', '3x + (1)(3)', '3x + 3'],
    });
  });

  test('(x - 1)(3) -> 3x - 3', () => {
    const ast = Testing.parse('(x - 1)(3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x - 3');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('3x - 3');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiply monomials',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);
    expect(step).toHaveSubstepsLike([
      ['-1', '-1'], // subtraction -> add inverse
      ['(x + -1)(3)', '(x)(3) + (-1)(3)'],
      ['(x)(3)', '3x'],
      ['(-1)(3)', '-3'],
      ['-3', '-3'], // add inverse -> subtraction
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '(x - 1)(3)',
        '(x + -1)(3)',
        '(x)(3) + (-1)(3)',
        '3x + (-1)(3)',
        '3x + -3',
        '3x - 3',
      ],
    });
  });

  test('3(x + 1) + 4 -> 3x + 3 + 4', () => {
    const ast = Testing.parse('3(x + 1) + 4');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x + 3 + 4');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('3x + 3 + 4');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(step).toHaveSubstepsLike([
      ['3(x + 1)', '3x + (3)(1)'],
      ['(3)(1)', '3'],
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: ['3(x + 1) + 4', '3x + (3)(1) + 4', '3x + 3 + 4'],
    });
  });

  test('3(x + y + z) -> 3x + 3y + 3z', () => {
    const ast = Testing.parse('3(x + y + z)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x + 3y + 3z');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual(
      '3x + 3y + 3z',
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('(-2)(x - 3) -> -2x + 6', () => {
    const ast = Testing.parse('(-2)(x - 3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('-2x + 6');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('-2x + 6');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying two negatives is a positive',
    ]);
    expect(step).toHaveSubstepsLike([
      ['-3', '-3'], // subtraction to addition -> inverse
      ['-2(x + -3)', '-2x + (-2)(-3)'], // TODO: figure out why this step wasn't applied
      ['-2x', '-2x'], // we're printing both (-2)(x) and -(2x) as the same thing here
      // If the printed values are the same we should elide the step
      // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
      // It's bit a more complicatated than that becuase we want the `-2x` that appears
      // in the previous step's `after` to be replaced.  We really need to find a way
      // to do this automatically if possible.
      ['(-2)(-3)', '6'],
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '-2(x - 3)',
        '-2(x + -3)',
        '-2x + (-2)(-3)',
        '-2x + (-2)(-3)', // we're printing both (-2)(x) and -(2x) as the same thing here
        // If the printed values are the same we should elide the step
        // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
        // It's bit a more complicatated than that becuase we want the `-2x` that appears
        // in the previous step's `after` to be replaced.  We really need to find a way
        // to do this automatically if possible.
        '-2x + 6',
      ],
    });
  });

  test('3 - (x + 1) -> -x + 2', () => {
    const ast = Testing.parse('3 - (x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3 - x - 1');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('3 - x - 1');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
      'adding the inverse is the same as subtraction',
    ]);

    expect(step).toHaveSubstepsLike([
      ['-(x + 1)', '-1(x + 1)'],
      ['-1(x + 1)', '-1x + (-1)(1)'],
      ['-1x', '-x'],
      ['(-1)(1)', '-1'],
      ['-x', '-x'], // add inverse -> subtraction
      ['-1', '-1'], // add inverse -> subtraction
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '3 - (x + 1)',
        '3 + -1(x + 1)',
        '3 + -1x + (-1)(1)',
        '3 + -x + (-1)(1)',
        '3 + -x + -1',
        '3 - x + -1',
        '3 - x - 1',
      ],
    });
  });

  test('(ab)(xy - yz)', () => {
    const ast = Testing.parse('(ab)(xy - yz)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('abxy - abyz');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual(
      'abxy - abyz',
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiply monomials',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(step).toHaveSubstepsLike([
      ['-yz', '-yz'], // subtraction -> add inverse
      ['(ab)(xy + -yz)', '(ab)(xy) + (ab)(-yz)'],
      ['(ab)(xy)', 'abxy'],
      ['(ab)(-yz)', '-abyz'],
      ['-abyz', '-abyz'], // add inverse -> subtraction
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '(ab)(xy - yz)',
        '(ab)(xy + -yz)',
        '(ab)(xy) + (ab)(-yz)',
        'abxy + (ab)(-yz)',
        'abxy + -abyz',
        'abxy - abyz',
      ],
    });
  });

  test('(-ab)(xy - yz)', () => {
    const ast = Testing.parse('(-ab)(xy - yz)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('-abxy + abyz');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual(
      '-abxy + abyz',
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying two negatives is a positive',
    ]);
  });

  // `distribute` only performs one distribution at a time
  test('3(x + 1) + 4(x - 1) -> 3x + 3 + 4(x - 1)', () => {
    const ast = Testing.parse('3(x + 1) + 4(x - 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('3x + 3 + 4(x - 1)');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual(
      '3x + 3 + 4(x - 1)',
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '3(x + 1) + 4(x - 1)',
        '3x + (3)(1) + 4(x - 1)',
        '3x + 3 + 4(x - 1)',
      ],
    });
  });

  test('x(x + 1) -> xx + x', () => {
    const ast = Testing.parse('x(x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('xx + x');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('xx + x');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: ['x(x + 1)', 'xx + (x)(1)', 'xx + x'],
    });
  });

  test('x(x - 1) -> xx - x', () => {
    const ast = Testing.parse('x(x - 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('xx - x');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('xx - x');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(step).toHaveSubstepsLike([
      ['-1', '-1'], // subtraction -> add inverse
      ['x(x + -1)', 'xx + (x)(-1)'],
      ['(x)(-1)', '-x'],
      ['-x', '-x'], // add inverse -> subtraction
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        'x(x - 1)',
        'x(x + -1)',
        'xx + (x)(-1)',
        'xx + -x',
        'xx - x',
      ],
    });
  });

  test('0 - (2x+5) -> 0 - 2x - 5', () => {
    const ast = Testing.parse('0 - (2x+5)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('0 - 2x - 5');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('0 - 2x - 5');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
      'adding the inverse is the same as subtraction',
    ]);

    expect(step).toHaveSubstepsLike([
      ['-(2x + 5)', '-1(2x + 5)'], // subtraction -> add inverse
      ['-1(2x + 5)', '-1(2x) + (-1)(5)'],
      ['-1(2x)', '-2x'],
      ['(-1)(5)', '-5'],
      // These look bad on their own, but should be okay when highlighted
      // within the larger expression
      ['-2x', '-2x'],
      ['-5', '-5'],
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '0 - (2x + 5)',
        '0 + -1(2x + 5)',
        '0 + -1(2x) + (-1)(5)',
        '0 + -2x + (-1)(5)',
        '0 + -2x + -5',
        '0 - 2x + -5',
        '0 - 2x - 5',
      ],
    });
  });

  test('-(2x+5) -> -2x - 5', () => {
    const ast = Testing.parse('-(2x+5)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(Testing.print(step.after)).toEqual('-2x - 5');
    expect(Testing.print(applySteps(ast, step.substeps))).toEqual('-2x - 5');

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(step).toHaveSubstepsLike([
      ['-(2x + 5)', '-1(2x + 5)'], // subtraction -> add inverse
      ['-1(2x + 5)', '-1(2x) + (-1)(5)'],
      ['-1(2x)', '-2x'],
      ['(-1)(5)', '-5'],
      // This looks bad on its own, but should be okay when highlighted
      // within the larger expression
      ['-5', '-5'],
    ]);

    expect(ast).toHaveFullStepsLike({
      steps: step.substeps,
      expressions: [
        '-(2x + 5)',
        '-1(2x + 5)',
        '-1(2x) + (-1)(5)',
        '-2x + (-1)(5)',
        '-2x + -5',
        '-2x - 5',
      ],
    });
  });
});
