import * as Semantic from '@math-blocks/semantic';

import { parse, newPrint as print } from '../../../test-util';
import { applyStep, applySteps } from '../../../apply';
import type { Step } from '../../../types';

import { distribute as _distribute } from '../distribute';

const printSubsteps = (step: Step): string[] => {
  return [
    ...step.substeps.map((step) => {
      const before = print(step.before);
      const after = print(step.after);
      return `${before} -> ${after}`;
    }),
  ];
};

const printFullSubsteps = (step: Step): string[] => {
  let current = step.before;
  return [
    print(step.before),
    ...step.substeps.map((step) => {
      current = applyStep(current, step);
      return print(current);
    }),
  ];
};

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
    const ast = parse('a(b + c)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"ab+ac"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"ab+ac"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('x + a(b + c) -> x + ab + ac', () => {
    const ast = parse('x + a(b + c)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"x+ab+ac"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"x+ab+ac"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('3(x + 1) -> 3x + 3', () => {
    const ast = parse('3(x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x+3"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x+3"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);
    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "3(x+1) -> 3x+(3)(1)",
        "(3)(1) -> 3",
      ]
    `);
  });

  test('(x + 1)(3) -> 3x + 3', () => {
    const ast = parse('(x + 1)(3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x+3"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x+3"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
      'multiply monomials',
    ]);
    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "(x+1)(3) -> (x)(3)+(1)(3)",
        "(x)(3) -> 3x",
        "(1)(3) -> 3",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "(x+1)(3)",
        "(x)(3)+(1)(3)",
        "3x+(1)(3)",
        "3x+3",
      ]
    `);
  });

  test('(x - 1)(3) -> 3x - 3', () => {
    const ast = parse('(x - 1)(3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x-3"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x-3"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiply monomials',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "(x-1)(3)",
        "(x+-1)(3)",
        "(x)(3)+(-1)(3)",
        "3x+(-1)(3)",
        "3x+-3",
        "3x-3",
      ]
    `);
  });

  test('3(x + 1) + 4 -> 3x + 3 + 4', () => {
    const ast = parse('3(x + 1) + 4');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x+3+4"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x+3+4"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "3(x+1) -> 3x+(3)(1)",
        "(3)(1) -> 3",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "3(x+1)+4",
        "3x+(3)(1)+4",
        "3x+3+4",
      ]
    `);
  });

  test('3(x + y + z) -> 3x + 3y + 3z', () => {
    const ast = parse('3(x + y + z)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x+3y+3z"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x+3y+3z"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
    ]);
  });

  test('(-2)(x - 3) -> -2x + 6', () => {
    const ast = parse('(-2)(x - 3)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"-2x+6"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"-2x+6"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying two negatives is a positive',
    ]);

    // we're printing both (-2)(x) and -(2x) as the same thing here
    // If the printed values are the same we should elide the step
    // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
    // It's bit a more complicatated than that becuase we want the `-2x` that appears
    // in the previous step's `after` to be replaced.  We really need to find a way
    // to do this automatically if possible.
    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-3 -> -3",
        "-2(x+-3) -> -2x+(-2)(-3)",
        "-2x -> -2x",
        "(-2)(-3) -> 6",
      ]
    `);

    // we're printing both (-2)(x) and -(2x) as the same thing here
    // If the printed values are the same we should elide the step
    // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
    // It's bit a more complicatated than that becuase we want the `-2x` that appears
    // in the previous step's `after` to be replaced.  We really need to find a way
    // to do this automatically if possible.
    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-2(x-3)",
        "-2(x+-3)",
        "-2x+(-2)(-3)",
        "-2x+(-2)(-3)",
        "-2x+6",
      ]
    `);
  });

  test('3 - (x + 1) -> -x + 2', () => {
    const ast = parse('3 - (x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3-x-1"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3-x-1"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-(x+1) -> -1(x+1)",
        "-1(x+1) -> -1x+(-1)(1)",
        "-1x -> -x",
        "(-1)(1) -> -1",
        "-x -> -x",
        "-1 -> -1",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "3-(x+1)",
        "3+-1(x+1)",
        "3+-1x+(-1)(1)",
        "3+-x+(-1)(1)",
        "3+-x+-1",
        "3-x+-1",
        "3-x-1",
      ]
    `);
  });

  test('(ab)(xy - yz)', () => {
    const ast = parse('(ab)(xy - yz)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"abxy-abyz"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"abxy-abyz"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiply monomials',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-yz -> -yz",
        "(ab)(xy+-yz) -> (ab)(xy)+(ab)(-yz)",
        "(ab)(xy) -> abxy",
        "(ab)(-yz) -> -abyz",
        "-abyz -> -abyz",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "(ab)(xy-yz)",
        "(ab)(xy+-yz)",
        "(ab)(xy)+(ab)(-yz)",
        "abxy+(ab)(-yz)",
        "abxy+-abyz",
        "abxy-abyz",
      ]
    `);
  });

  test('(-ab)(xy - yz)', () => {
    const ast = parse('(-ab)(xy - yz)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"-abxy+abyz"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"-abxy+abyz"`,
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
    const ast = parse('3(x + 1) + 4(x - 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"3x+3+4(x-1)"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"3x+3+4(x-1)"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "3(x+1)+4(x-1)",
        "3x+(3)(1)+4(x-1)",
        "3x+3+4(x-1)",
      ]
    `);
  });

  test('x(x + 1) -> xx + x', () => {
    const ast = parse('x(x + 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"xx+x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"xx+x"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'multiply each term',
      'multiply monomials',
    ]);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "x(x+1)",
        "xx+(x)(1)",
        "xx+x",
      ]
    `);
  });

  test('x(x - 1) -> xx - x', () => {
    const ast = parse('x(x - 1)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"xx-x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"xx-x"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-1 -> -1",
        "x(x+-1) -> xx+(x)(-1)",
        "(x)(-1) -> -x",
        "-x -> -x",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "x(x-1)",
        "x(x+-1)",
        "xx+(x)(-1)",
        "xx+-x",
        "xx-x",
      ]
    `);
  });

  test('0 - (2x+5) -> 0 - 2x - 5', () => {
    const ast = parse('0 - (2x+5)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"0-2x-5"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"0-2x-5"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-(2x+5) -> -1(2x+5)",
        "-1(2x+5) -> (-1)(2x)+(-1)(5)",
        "(-1)(2x) -> -2x",
        "(-1)(5) -> -5",
        "-2x -> -2x",
        "-5 -> -5",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "0-(2x+5)",
        "0+-1(2x+5)",
        "0+(-1)(2x)+(-1)(5)",
        "0+-2x+(-1)(5)",
        "0+-2x+-5",
        "0-2x+-5",
        "0-2x-5",
      ]
    `);
  });

  test('-(2x+5) -> -2x - 5', () => {
    const ast = parse('-(2x+5)');

    const step = distribute(ast);

    expect(step.message).toEqual('distribute');
    expect(print(step.after)).toMatchInlineSnapshot(`"-2x-5"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"-2x-5"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'negation is the same as multiplying by negative one',
      'multiply each term',
      'multiplying a negative by a positive is negative',
      'multiplying a negative by a positive is negative',
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-(2x+5) -> -1(2x+5)",
        "-1(2x+5) -> (-1)(2x)+(-1)(5)",
        "(-1)(2x) -> -2x",
        "(-1)(5) -> -5",
        "-5 -> -5",
      ]
    `);

    expect(printFullSubsteps(step)).toMatchInlineSnapshot(`
      [
        "-(2x+5)",
        "-1(2x+5)",
        "(-1)(2x)+(-1)(5)",
        "-2x+(-1)(5)",
        "-2x+-5",
        "-2x-5",
      ]
    `);
  });
});
