import { types, builders } from '@math-blocks/semantic';
import { print, parse } from '@math-blocks/testing';

import { solveLinear } from '../solve-linear';
import { NumberOfSolutions } from '../../types';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

// TODO: copy the test cases from solve.test.ts
describe('solveLinear', () => {
  it('2x - 3y - 5 = -y + 10', () => {
    const before = parseNumRel('2x - 3y - 5 = -y + 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = y + 15 / 2"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x - 3y - 5 = -y + 10",
        "2x - 3y - 5 + 5 = -y + 10 + 5",
        "2x - 3y = -y + 15",
        "2x - 3y + 3y = -y + 3y + 15",
        "2x = 2y + 15",
        "2x / 2 = (2y + 15) / 2",
        "x = y + 15 / 2",
      ]
    `);
  });

  it('-y + 10 = 2x - 3y - 5 (reversed)', () => {
    const before = parseNumRel('-y + 10 = 2x - 3y - 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y + 15 / 2 = x"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-y + 10 = 2x - 3y - 5",
        "-y + 10 + 5 = 2x - 3y - 5 + 5",
        "-y + 15 = 2x - 3y",
        "-y + 3y + 15 = 2x - 3y + 3y",
        "2y + 15 = 2x",
        "(2y + 15) / 2 = 2x / 2",
        "y + 15 / 2 = x",
      ]
    `);
  });

  it('2x + 5 = x + 10', () => {
    const before = parseNumRel('2x + 5 = x + 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = 5"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x + 5 = x + 10",
        "2x + 5 - 5 = x + 10 - 5",
        "2x = x + 5",
        "2x - x = x - x + 5",
        "x = 5",
      ]
    `);
  });

  // TODO: If we notice that the variable we're solving for is on both sides with
  // the same coefficient then we can subtract it from both sides first.
  it('x + 1 = x + 2 (no solutions)', () => {
    const before = parseNumRel('x + 1 = x + 2');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"0 = 1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.None);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x + 1 = x + 2",
        "x + 1 - 1 = x + 2 - 1",
        "x = x + 1",
        "x - x = x - x + 1",
        "0 = 1",
      ]
    `);
  });

  // TODO: If we notice that the variable we're solving for is on both sides with
  // the same coefficient then we can subtract it from both sides first.
  it('x + 2 = x + 2 (infinite solutions)', () => {
    const before = parseNumRel('x + 2 = x + 2');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"0 = 0"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x + 2 = x + 2",
        "x + 2 - 2 = x + 2 - 2",
        "x = x",
        "x - x = x - x",
        "0 = 0",
      ]
    `);
  });

  it('2x + 0 = 5 (simplify + 0 first)', () => {
    const before = parseNumRel('2x + 0 = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = 5 / 2"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x + 0 = 5",
        "2x = 5",
        "2x / 2 = 5 / 2",
        "x = 5 / 2",
      ]
    `);
  });

  it('2x + 3x = 7 - 4 (collect like terms first)', () => {
    const before = parseNumRel('2x + 3x = 7 - 4');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = 3 / 5"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x + 3x = 7 - 4",
        "5x = 3",
        "5x / 5 = 3 / 5",
        "x = 3 / 5",
      ]
    `);
  });

  it('-x / -1 = -7', () => {
    const before = parseNumRel('-x / -1 = -7');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = -7"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-x / -1 = -7",
        "x = -7",
      ]
    `);
  });

  it('-2x + 5 = 10', () => {
    const before = parseNumRel('-2x + 5 = 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = -(5 / 2)"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x + 5 = 10",
        "-2x + 5 - 5 = 10 - 5",
        "-2x = 5",
        "-2x / -2 = 5 / -2",
        "x = -(5 / 2)",
      ]
    `);
  });

  it('-2x + 5 > 10', () => {
    const before = parseNumRel('-2x + 5 > 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x < -(5 / 2)"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x + 5 > 10",
        "-2x + 5 - 5 > 10 - 5",
        "-2x > 5",
        "-2x / -2 < 5 / -2",
        "x < -(5 / 2)",
      ]
    `);
  });

  it('-2x + 5 ≥  10', () => {
    const before = parseNumRel('-2x + 5 ≥  10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x ≤ -(5 / 2)"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x + 5 ≥ 10",
        "-2x + 5 - 5 ≥ 10 - 5",
        "-2x ≥ 5",
        "-2x / -2 ≤ 5 / -2",
        "x ≤ -(5 / 2)",
      ]
    `);
  });

  it('x/2 + 1/2 = 2x/3 + 1/3', () => {
    const before = parseNumRel('x/2 + 1/2 = 2x/3 + 1/3');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"-x = -1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x / 2 + 1 / 2 = 2x / 3 + 1 / 3",
        "x / 2 + 1 / 2 - 1 / 2 = 2x / 3 + 1 / 3 - 1 / 2",
        "x / 2 = 2x / 3 - 1 / 6",
        "x / 2 - 2x / 3 = 2x / 3 - 2x / 3 - 1 / 6",
        "-(x / 6) = -(1 / 6)",
        "-(x / 6) * 6 = -(1 / 6) * 6",
        "-x = -1",
      ]
    `);
  });

  it('x / 2 = 5', () => {
    const before = parseNumRel('x / 2 = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = 10"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x / 2 = 5",
        "x / 2 * 2 = 5 * 2",
        "x = 10",
      ]
    `);
  });

  it('(1/2)(x) = 5', () => {
    const before = parseNumRel('(1/2)(x) = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = 10"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    // TODO: go from (1/2)(x) = 5 to (2)(1/2)(x) = 5 * 2
    expect(steps).toMatchInlineSnapshot(`
      [
        "(1 / 2)(x) = 5",
        "x / 2 = 5",
        "x / 2 * 2 = 5 * 2",
        "x = 10",
      ]
    `);
  });

  it('1 - n = 3/2 n + 17/2', () => {
    const before = parseNumRel('1 - n = (3/2)(n) + 17/2');
    const ident = builders.identifier('n');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"n = -3"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    // TODO: use latex for fractions in tests
    // instead of "-n - (3 / 2)(n) = (3 / 2)(n) - (3 / 2)(n) + 15 / 2",
    // we could have "-n \frac{3}{2}n = \frac{3}{2}n - \frac{3}{2}n + \frac{15}{2}"

    expect(steps).toMatchInlineSnapshot(`
      [
        "1 - n = (3 / 2)(n) + 17 / 2",
        "1 - n = 3n / 2 + 17 / 2",
        "1 - 1 - n = 3n / 2 + 17 / 2 - 1",
        "-n = 3n / 2 + 15 / 2",
        "-n - 3n / 2 = 3n / 2 - 3n / 2 + 15 / 2",
        "-(5n / 2) = 15 / 2",
        "-(5n / 2) * 2 = 15 / 2 * 2",
        "-5n = 15",
        "-5n / -5 = 15 / -5",
        "n = -3",
      ]
    `);
  });

  it('(2 + y / 3) + 2y = -1', () => {
    const before = parseNumRel('(2 + y / 3) + 2y = -1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y = -(9 / 7)"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "(2 + y / 3) + 2y = -1",
        "2 + 7y / 3 = -1",
        "2 - 2 + 7y / 3 = -1 - 2",
        "7y / 3 = -3",
        "7y / 3 * 3 = -3 * 3",
        "7y = -9",
        "7y / 7 = -9 / 7",
        "y = -(9 / 7)",
      ]
    `);
  });

  it('-1 = x + 2y', () => {
    const before = parseNumRel('-1 = x + 2y');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"-(1 / 2) - x / 2 = y"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-1 = x + 2y",
        "-1 - x = x - x + 2y",
        "-1 - x = 2y",
        "(-1 - x) / 2 = 2y / 2",
        "-(1 / 2) - x / 2 = y",
      ]
    `);
  });

  it('2(-(y / 2) + 1 / 2) + y = 1', () => {
    const before = parseNumRel('2(-(y / 2) + 1 / 2) + y = 1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"1 = 1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2(-(y / 2) + 1 / 2) + y = 1",
        "1 = 1",
      ]
    `);
  });

  describe('bail-out cases', () => {});
});
