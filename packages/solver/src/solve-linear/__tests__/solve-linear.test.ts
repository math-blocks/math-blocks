import { types, builders } from '@math-blocks/semantic';

import { parse, print } from '../../test-util';
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

    expect(print(result.after)).toMatchInlineSnapshot(`"x=y+\\frac{15}{2}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x-3y-5=-y+10",
        "2x-3y-5+5=-y+10+5",
        "2x-3y=-y+15",
        "2x-3y+3y=-y+3y+15",
        "2x=2y+15",
        "\\frac{2x}{2}=\\frac{2y+15}{2}",
        "x=y+\\frac{15}{2}",
      ]
    `);
  });

  it('-y + 10 = 2x - 3y - 5 (reversed)', () => {
    const before = parseNumRel('-y + 10 = 2x - 3y - 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y+\\frac{15}{2}=x"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-y+10=2x-3y-5",
        "-y+10+5=2x-3y-5+5",
        "-y+15=2x-3y",
        "-y+3y+15=2x-3y+3y",
        "2y+15=2x",
        "\\frac{2y+15}{2}=\\frac{2x}{2}",
        "y+\\frac{15}{2}=x",
      ]
    `);
  });

  it('2x + 5 = x + 10', () => {
    const before = parseNumRel('2x + 5 = x + 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=5"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x+5=x+10",
        "2x+5-5=x+10-5",
        "2x=x+5",
        "2x-x=x-x+5",
        "x=5",
      ]
    `);
  });

  // TODO: If we notice that the variable we're solving for is on both sides with
  // the same coefficient then we can subtract it from both sides first.
  it('x + 1 = x + 2 (no solutions)', () => {
    const before = parseNumRel('x + 1 = x + 2');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"0=1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.None);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x+1=x+2",
        "x+1-1=x+2-1",
        "x=x+1",
        "x-x=x-x+1",
        "0=1",
      ]
    `);
  });

  // TODO: If we notice that the variable we're solving for is on both sides with
  // the same coefficient then we can subtract it from both sides first.
  it('x + 2 = x + 2 (infinite solutions)', () => {
    const before = parseNumRel('x + 2 = x + 2');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"0=0"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "x+2=x+2",
        "x+2-2=x+2-2",
        "x=x",
        "x-x=x-x",
        "0=0",
      ]
    `);
  });

  it('2x + 0 = 5 (simplify + 0 first)', () => {
    const before = parseNumRel('2x + 0 = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=\\frac{5}{2}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x+0=5",
        "2x=5",
        "\\frac{2x}{2}=\\frac{5}{2}",
        "x=\\frac{5}{2}",
      ]
    `);
  });

  it('2x + 3x = 7 - 4 (collect like terms first)', () => {
    const before = parseNumRel('2x + 3x = 7 - 4');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=\\frac{3}{5}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2x+3x=7-4",
        "5x=3",
        "\\frac{5x}{5}=\\frac{3}{5}",
        "x=\\frac{3}{5}",
      ]
    `);
  });

  it('-x / -1 = -7', () => {
    const before = parseNumRel('-x / -1 = -7');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=-7"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "\\frac{-x}{-1}=-7",
        "x=-7",
      ]
    `);
  });

  it('-2x + 5 = 10', () => {
    const before = parseNumRel('-2x + 5 = 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=-\\frac{5}{2}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x+5=10",
        "-2x+5-5=10-5",
        "-2x=5",
        "\\frac{-2x}{-2}=\\frac{5}{-2}",
        "x=-\\frac{5}{2}",
      ]
    `);
  });

  it('-2x + 5 > 10', () => {
    const before = parseNumRel('-2x + 5 > 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x\\lt-\\frac{5}{2}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x+5\\gt10",
        "-2x+5-5\\gt10-5",
        "-2x\\gt5",
        "\\frac{-2x}{-2}\\lt\\frac{5}{-2}",
        "x\\lt-\\frac{5}{2}",
      ]
    `);
  });

  it('-2x + 5 ≥  10', () => {
    const before = parseNumRel('-2x + 5 ≥  10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x\\leq-\\frac{5}{2}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-2x+5\\geq10",
        "-2x+5-5\\geq10-5",
        "-2x\\geq5",
        "\\frac{-2x}{-2}\\leq\\frac{5}{-2}",
        "x\\leq-\\frac{5}{2}",
      ]
    `);
  });

  it('x/2 + 1/2 = 2x/3 + 1/3', () => {
    const before = parseNumRel('x/2 + 1/2 = 2x/3 + 1/3');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"-x=-1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "\\frac{x}{2}+\\frac{1}{2}=\\frac{2x}{3}+\\frac{1}{3}",
        "\\frac{x}{2}+\\frac{1}{2}-\\frac{1}{2}=\\frac{2x}{3}+\\frac{1}{3}-\\frac{1}{2}",
        "\\frac{x}{2}=\\frac{2x}{3}-\\frac{1}{6}",
        "\\frac{x}{2}-\\frac{2x}{3}=\\frac{2x}{3}-\\frac{2x}{3}-\\frac{1}{6}",
        "-\\frac{x}{6}=-\\frac{1}{6}",
        "-\\frac{x}{6}*6=-\\frac{1}{6}*6",
        "-x=-1",
      ]
    `);
  });

  it('x / 2 = 5', () => {
    const before = parseNumRel('x / 2 = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=10"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "\\frac{x}{2}=5",
        "\\frac{x}{2}*2=5*2",
        "x=10",
      ]
    `);
  });

  it('(1/2)(x) = 5', () => {
    const before = parseNumRel('(1/2)(x) = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=10"`);
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
        "\\frac{1}{2}x=5",
        "\\frac{x}{2}=5",
        "\\frac{x}{2}*2=5*2",
        "x=10",
      ]
    `);
  });

  it('1 - n = 3/2 n + 17/2', () => {
    const before = parseNumRel('1 - n = (3/2)(n) + 17/2');
    const ident = builders.identifier('n');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"n=-3"`);
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
        "1-n=\\frac{3}{2}n+\\frac{17}{2}",
        "1-n=\\frac{3n}{2}+\\frac{17}{2}",
        "1-1-n=\\frac{3n}{2}+\\frac{17}{2}-1",
        "-n=\\frac{3n}{2}+\\frac{15}{2}",
        "-n-\\frac{3n}{2}=\\frac{3n}{2}-\\frac{3n}{2}+\\frac{15}{2}",
        "-\\frac{5n}{2}=\\frac{15}{2}",
        "-\\frac{5n}{2}*2=\\frac{15}{2}*2",
        "-5n=15",
        "\\frac{-5n}{-5}=\\frac{15}{-5}",
        "n=-3",
      ]
    `);
  });

  it('(2 + y / 3) + 2y = -1', () => {
    const before = parseNumRel('(2 + y / 3) + 2y = -1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y=-\\frac{9}{7}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "(2+\\frac{y}{3})+2y=-1",
        "2+\\frac{7y}{3}=-1",
        "2-2+\\frac{7y}{3}=-1-2",
        "\\frac{7y}{3}=-3",
        "\\frac{7y}{3}*3=-3*3",
        "7y=-9",
        "\\frac{7y}{7}=\\frac{-9}{7}",
        "y=-\\frac{9}{7}",
      ]
    `);
  });

  it('-1 = x + 2y', () => {
    const before = parseNumRel('-1 = x + 2y');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(
      `"-\\frac{1}{2}-\\frac{x}{2}=y"`,
    );
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-1=x+2y",
        "-1-x=x-x+2y",
        "-1-x=2y",
        "\\frac{-1-x}{2}=\\frac{2y}{2}",
        "-\\frac{1}{2}-\\frac{x}{2}=y",
      ]
    `);
  });

  it('2(-(y / 2) + 1 / 2) + y = 1', () => {
    const before = parseNumRel('2(-(y / 2) + 1 / 2) + y = 1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"1=1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);

    const steps = [
      print(result.before),
      ...result.substeps.map((step) => {
        return print(step.after);
      }),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "2(-\\frac{y}{2}+\\frac{1}{2})+y=1",
        "1=1",
      ]
    `);
  });

  describe('bail-out cases', () => {});
});
