import * as Semantic from '@math-blocks/semantic';

import { applySteps } from '../../../apply';
import type { Step } from '../../../types';
import { parse, print } from '../../../test-util';

import { collectLikeTerms as _collectLikeTerms } from '../collect-like-terms';

const printSubsteps = (step: Step): string[] => {
  return [
    print(step.before),
    ...step.substeps.map((step) => print(step.after)),
  ];
};

const collectLikeTerms = (node: Semantic.types.Node): Step => {
  if (!Semantic.util.isNumeric(node)) {
    throw new Error('node is not a NumericNode');
  }
  const step = _collectLikeTerms(node);
  if (!step) {
    throw new Error('no step returned');
  }
  return step;
};

describe('collect like terms', () => {
  test('2x + 3x -> 5x', () => {
    const ast = parse('2x + 3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"5x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(`"5x"`);

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "2x + 3x",
        "(2 + 3)x",
        "5x",
      ]
    `);
  });

  test('2x + 1 + 3x -> 5x + 1', () => {
    const ast = parse('2x + 1 + 3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"5x + 1"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"5x + 1"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'reorder terms so that like terms are beside each other',
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "2x + 1 + 3x",
        "2x + 3x + 1",
        "(2 + 3)x + 1",
        "5x + 1",
      ]
    `);
  });

  test('2x - 1 + 3x -> 5x - 1', () => {
    const ast = parse('2x - 1 + 3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"5x - 1"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"5x - 1"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'reorder terms so that like terms are beside each other',
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
      'adding the inverse is the same as subtraction',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "2x - 1 + 3x",
        "2x + -1 + 3x",
        "2x + 3x + -1",
        "(2 + 3)x + -1",
        "5x + -1",
        "5x - 1",
      ]
    `);
  });

  test('2x + 3x -> unchanged', () => {
    const ast = parse('2x + 3y');

    expect(() => collectLikeTerms(ast)).toThrowErrorMatchingInlineSnapshot(
      `"no step returned"`,
    );
  });

  test('x + 3x -> 4x', () => {
    const ast = parse('x + 3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"4x"`);
  });

  test('-x + 3x -> 2x', () => {
    const ast = parse('-x + 3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"2x"`);
  });

  // Shows that we drop the `1` in `-1x`
  test('x - 2x -> -x', () => {
    const ast = parse('x - 2x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"-x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(`"-x"`);

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse',
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
      'simplify terms',
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "x - 2x",
        "x + -2x",
        "(1 + -2)x",
        "-1x",
        "-x",
      ]
    `);
  });

  // Shows that we convert additive inverse to subtraction where possible
  test('a + x - 2x -> a - x', () => {
    const ast = parse('a + x - 2x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"a - x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"a - x"`,
    );
  });

  // Shows that we convert additive inverse to subtraction where possible
  test('a + 2x - 5x -> a - 3x', () => {
    const ast = parse('a + 2x - 5x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"a - 3x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"a - 3x"`,
    );
  });

  test('2x - -3x -> 5x', () => {
    const ast = parse('2x - -3x');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"5x"`);
  });

  // TODO: add transform that converts (neg (mul 2 x)) to (mul (neg 2 x))
  // or update how deal directly with the first and then add a transform that
  // converts (mul (neg 2) x) to (neg (mul 2 x)).  The second option seems easier.
  test('2x - (-3)(x) -> 5x', () => {
    const ast = parse('2x - (-3)(x)');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"5x"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(`"5x"`);

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse', // substeps
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "2x - -3x",
        "2x + --3x",
        "(2 + --3)x",
        "5x",
      ]
    `);
  });

  test('5x + 1 - 3x - 7 -> 2x - 6', () => {
    const ast = parse('5x + 1 - 3x - 7');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"2x - 6"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"2x - 6"`,
    );

    expect(step.substeps.map((substep) => substep.message)).toEqual([
      'subtraction is the same as adding the inverse', // substeps
      'reorder terms so that like terms are beside each other',
      'factor variable part of like terms', // substeps
      'compute new coefficients', // substeps
      'adding the inverse is the same as subtraction', // substeps
    ]);

    expect(printSubsteps(step)).toMatchInlineSnapshot(`
      [
        "5x + 1 - 3x - 7",
        "5x + 1 + -3x + -7",
        "5x + -3x + 1 + -7",
        "(5 + -3)x + (1 + -7)",
        "2x + -6",
        "2x - 6",
      ]
    `);
  });

  test('4x + -3x - 1 -> 7x - 1', () => {
    const ast = parse('4x + -3x - 1');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"x - 1"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"x - 1"`,
    );
  });

  test('4x - 3x - 1 -> 7x - 1', () => {
    const ast = parse('4x - 3x - 1');

    const step = collectLikeTerms(ast);

    expect(step.message).toEqual('collect like terms');
    expect(print(step.after)).toMatchInlineSnapshot(`"x - 1"`);
    expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
      `"x - 1"`,
    );
  });

  describe('fractions', () => {
    test('(1/2)x + (1/3)x -> (5/6)x', () => {
      const ast = parse('(1/2)x + (1/3)x');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(5 / 6)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"(5 / 6)(x)"`,
      );

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
      ]);

      expect(printSubsteps(step)).toMatchInlineSnapshot(`
        [
          "(1 / 2)(x) + (1 / 3)(x)",
          "(1 / 2 + 1 / 3)x",
          "(5 / 6)(x)",
        ]
      `);
    });

    test('x/2 + x/3 -> (5/6)x', () => {
      const ast = parse('x/2 + x/3');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(5 / 6)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"(5 / 6)(x)"`,
      );

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
      ]);

      expect(printSubsteps(step)).toMatchInlineSnapshot(`
        [
          "x / 2 + x / 3",
          "(1 / 2 + 1 / 3)x",
          "(5 / 6)(x)",
        ]
      `);
    });

    test('2x/7 + 3x/7 -> (5/7)x', () => {
      const ast = parse('2x/7 + 3x/7');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(5 / 7)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"(5 / 7)(x)"`,
      );

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
      ]);

      expect(printSubsteps(step)).toMatchInlineSnapshot(`
        [
          "2x / 7 + 3x / 7",
          "(2 / 7 + 3 / 7)x",
          "(5 / 7)(x)",
        ]
      `);
    });

    test('x/2 - x/3 -> x / 6', () => {
      const ast = parse('x/2 - x/3');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(1 / 6)(x)"`);
    });

    test('x/2 + x/-3 -> x', () => {
      const ast = parse('x/2 + x/-3');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(1 / 6)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"(1 / 6)(x)"`,
      );
    });

    test('x/-2 + x/3 -> x', () => {
      const ast = parse('x/-2 + x/3');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"-(1 / 6)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"-(1 / 6)(x)"`,
      );
    });

    test('x/2 + x/3 -> x', () => {
      const ast = parse('x/2 + x/3');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"(5 / 6)(x)"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"(5 / 6)(x)"`,
      );
    });
  });

  describe('terms with multiple variables', () => {
    test('2xy + 3xy -> 5xy', () => {
      const ast = parse('2xy + 3xy');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"5xy"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"5xy"`,
      );
    });

    test('2ab + 3xy + 4ab - xy -> 6ab + 2xy', () => {
      const ast = parse('2ab + 3xy + 4ab - xy');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"6ab + 2xy"`);
      expect(print(applySteps(ast, step.substeps))).toMatchInlineSnapshot(
        `"6ab + 2xy"`,
      );

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'subtraction is the same as adding the inverse',
        'reorder terms so that like terms are beside each other',
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
        'simplify terms',
      ]);

      expect(printSubsteps(step)).toMatchInlineSnapshot(`
        [
          "2ab + 3xy + 4ab - xy",
          "2ab + 3xy + 4ab + -xy",
          "2ab + 4ab + 3xy + -xy",
          "(2 + 4)(ab) + (3 + -1)(xy)",
          "6(ab) + 2(xy)",
          "6ab + 2xy",
        ]
      `);
    });
  });

  describe('simplifying terms', () => {
    test('x + 1 + 4 -> x + 5', () => {
      const ast = parse('x + 1 + 4');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"x + 5"`);
    });

    test('3 - 1x - 1 -> -x + 2', () => {
      const ast = parse('3 - 1x - 1');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      // TODO: have the output use -x instead of -1x
      expect(print(step.after)).toMatchInlineSnapshot(`"2 - 1x"`);
    });

    test('3 - x - 1 -> -x + 2', () => {
      const ast = parse('3 - x - 1');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"2 - x"`);
    });
  });

  describe('canceling terms', () => {
    test('8 + 2x - 2x -> 8', () => {
      const ast = parse('8 + 2x - 2x');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"8"`);

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'subtraction is the same as adding the inverse',
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
        'drop adding zero',
      ]);

      const substeps = [
        print(step.before),
        ...step.substeps.map((substep) => print(substep.after)),
      ];

      expect(substeps).toMatchInlineSnapshot(`
        [
          "8 + 2x - 2x",
          "8 + 2x + -2x",
          "8 + 0",
          "8 + 0",
          "8",
        ]
      `);
    });

    test('2x - 2x - 8 -> -8', () => {
      const ast = parse('2x - 2x - 8');

      const step = collectLikeTerms(ast);

      expect(step.message).toEqual('collect like terms');
      expect(print(step.after)).toMatchInlineSnapshot(`"-8"`);

      expect(step.substeps.map((substep) => substep.message)).toEqual([
        'subtraction is the same as adding the inverse',
        'factor variable part of like terms', // substeps
        'compute new coefficients', // substeps
        'adding the inverse is the same as subtraction',
        'drop adding zero',
      ]);

      const substeps = [
        print(step.before),
        ...step.substeps.map((substep) => print(substep.after)),
      ];

      expect(substeps).toMatchInlineSnapshot(`
        [
          "2x - 2x - 8",
          "2x + -2x + -8",
          "0 + -8",
          "0 + -8",
          "0 - 8",
          "-8",
        ]
      `);
    });
  });
});
