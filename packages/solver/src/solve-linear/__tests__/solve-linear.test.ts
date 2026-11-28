import { types, builders } from '@math-blocks/semantic';

import { parse, print } from '../../test-util';
import { isSolvedFor, solveLinear } from '../solve-linear';
import { NumberOfSolutions, StepKind } from '../../types';
import type { Step } from '../../types';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

// Replaces each 'move terms to one side' and 'isolate the variable' strategy
// step with its substeps, so that the snapshots below list every concrete
// step.  The 'strategies' tests check the strategy steps themselves.
const concreteSteps = (step: Step): readonly Step[] =>
  step.substeps.flatMap((substep) =>
    substep.kind === StepKind.MoveTermsToOneSide ||
    substep.kind === StepKind.IsolateVariable
      ? substep.substeps
      : [substep],
  );

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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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

  it('\\frac{-x}{-1} = -7', () => {
    const before = parseNumRel('\\frac{-x}{-1} = -7');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=-7"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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

  it('\\frac{x}{2}+\\frac{1}{2}=\\frac{2x}{3}+\\frac{1}{3}', () => {
    const before = parseNumRel(
      '\\frac{x}{2}+\\frac{1}{2}=\\frac{2x}{3}+\\frac{1}{3}',
    );
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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
        "-x*-1=-1*-1",
        "x=1",
      ]
    `);
  });

  it('\\frac{x}{2}=5', () => {
    const before = parseNumRel('\\frac{x}{2}=5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=10"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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

  it('\\frac{1}{2}(x) = 5', () => {
    const before = parseNumRel('\\frac{1}{2}(x) = 5');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=10"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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

  it('1-n=\\frac{3}{2}n+\\frac{17}{2}', () => {
    const before = parseNumRel('1-n=\\frac{3}{2}n+\\frac{17}{2}');
    const ident = builders.identifier('n');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"n=-3"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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

  it('(2+\\frac{y}{3})+2y=-1', () => {
    const before = parseNumRel('(2+\\frac{y}{3})+2y=-1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y=-\\frac{9}{7}"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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
      ...concreteSteps(result).map((step) => {
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

  it('2(-\\frac{y}{2} + \\frac{1}{2}) + y = 1', () => {
    const before = parseNumRel('2(-\\frac{y}{2} + \\frac{1}{2}) + y = 1');
    const ident = builders.identifier('y');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"1=1"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => {
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

  // A coefficient of -1 is a Neg node rather than a Mul with a numeric
  // coefficient.
  it('-x > 2', () => {
    const before = parseNumRel('-x > 2');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x\\lt-2"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-x\\gt2",
        "-x*-1\\lt2*-1",
        "x\\lt-2",
      ]
    `);
  });

  it('-x = 3', () => {
    const before = parseNumRel('-x = 3');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=-3"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-x=3",
        "-x*-1=3*-1",
        "x=-3",
      ]
    `);
  });

  it('3 = -x', () => {
    const before = parseNumRel('3 = -x');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"-3=x"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "3=-x",
        "3*-1=-x*-1",
        "-3=x",
      ]
    `);
  });

  it('-x + 5 \\le 1', () => {
    const before = parseNumRel('-x + 5 \\le 1');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x\\geq4"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-x+5\\leq1",
        "-x+5-5\\leq1-5",
        "-x\\leq-4",
        "-x*-1\\geq-4*-1",
        "x\\geq4",
      ]
    `);
  });

  it('-\\frac{x}{2} = 3', () => {
    const before = parseNumRel('-\\frac{x}{2} = 3');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x=-6"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "-\\frac{x}{2}=3",
        "-\\frac{x}{2}*2=3*2",
        "-x=6",
        "-x*-1=6*-1",
        "x=-6",
      ]
    `);
  });

  it('4b + 5 = 1 + 5b', () => {
    const before = parseNumRel('4b + 5 = 1 + 5b');
    const ident = builders.identifier('b');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"b=4"`);
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);

    const steps = [
      print(result.before),
      ...concreteSteps(result).map((step) => print(step.after)),
    ];

    expect(steps).toMatchInlineSnapshot(`
      [
        "4b+5=1+5b",
        "4b+5-5=1-5+5b",
        "4b=-4+5b",
        "4b-5b=-4+5b-5b",
        "-b=-4",
        "-b*-1=-4*-1",
        "b=4",
      ]
    `);
  });

  it('4b + 5 = 1 + 5b built from semantic builders', () => {
    const b = builders.identifier('b');
    const before = builders.eq([
      builders.add([
        builders.mul([builders.number('4'), b], true),
        builders.number('5'),
      ]),
      builders.add([
        builders.number('1'),
        builders.mul([builders.number('5'), b], true),
      ]),
    ]);
    const result = solveLinear(before, b)!;

    expect(print(result.after)).toEqual('b=4');
    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);
  });

  // Removing a negative coefficient used to leave these unsimplified, e.g.
  // `x=\\frac{1}{-1}`, `x=-0` or `x=-1^{0}-2y`.
  it.each`
    input                  | expected
    ${'x + 2 = 3 + x + x'} | ${'x=-1'}
    ${'2x = 3x'}           | ${'x=0'}
    ${'-x = 1 + 2y'}       | ${'x=-1-2y'}
    ${'-x + 2y > 1'}       | ${'x\\lt-1+2y'}
    ${'-2x = 1 + 2y'}      | ${'x=-\\frac{1}{2}-y'}
  `('solveLinear($input) -> $expected', ({ input, expected }) => {
    const result = solveLinear(parseNumRel(input), builders.identifier('x'))!;
    expect(print(result.after)).toEqual(expected);
  });
});

describe('isSolvedFor', () => {
  const x = builders.identifier('x');

  it.each`
    input           | expected
    ${'x = 3'}      | ${true}
    ${'3 = x'}      | ${true}
    ${'x < y + 1'}  | ${true}
    ${'y + 1 > x'}  | ${true}
    ${'-x = 3'}     | ${false}
    ${'2x = 3'}     | ${false}
    ${'x = 2x + 1'} | ${false}
    ${'x + 1 = 3'}  | ${false}
    ${'y = 3'}      | ${false}
  `('isSolvedFor($input) -> $expected', ({ input, expected }) => {
    expect(isSolvedFor(parseNumRel(input), x)).toBe(expected);
  });
});

// Summarizes the strategy layer of a 'solve for variable' step: one line per
// strategy step, listing the concrete operations it's made of.
const describeStrategies = (step: Step): string[] =>
  step.substeps.map((strategy) => {
    const ops = strategy.substeps.map((substep) =>
      substep.kind === StepKind.DoSameOperationToBothSides
        ? `${substep.operation} ${print(substep.value)}`
        : substep.kind,
    );
    return `${strategy.kind}: ${ops.join(', ')}`;
  });

describe('solveLinear strategies', () => {
  const solve = (input: string): Step => {
    const result = solveLinear(parseNumRel(input), builders.identifier('x'));
    if (!result) {
      throw new Error(`couldn't solve ${input}`);
    }
    return result;
  };

  it('wraps subtracting a constant in a "move terms to one side" step', () => {
    const result = solve('2x + 5 = 10');

    expect(describeStrategies(result)).toMatchInlineSnapshot(`
      [
        "move-terms-to-one-side: sub 5, simplify-both-sides",
        "isolate-variable: div 2, simplify-left-hand-side",
      ]
    `);

    const [move] = result.substeps;
    expect(move.kind).toEqual(StepKind.MoveTermsToOneSide);
    expect(move.substeps[0]).toMatchObject({
      kind: StepKind.DoSameOperationToBothSides,
      operation: 'sub',
    });
  });

  it('wraps adding a constant in a "move terms to one side" step', () => {
    expect(describeStrategies(solve('x - 5 = 10'))).toMatchInlineSnapshot(`
      [
        "move-terms-to-one-side: add 5, simplify-both-sides",
      ]
    `);
  });

  it('moves variable terms and constants in one "move terms to one side" step', () => {
    expect(describeStrategies(solve('4x + 2 = 3x - 7'))).toMatchInlineSnapshot(`
      [
        "move-terms-to-one-side: sub 2, simplify-both-sides, sub 3x, simplify-both-sides",
      ]
    `);
  });

  it('wraps dividing by the coefficient in an "isolate the variable" step', () => {
    expect(describeStrategies(solve('2x = 10'))).toMatchInlineSnapshot(`
      [
        "isolate-variable: div 2, simplify-both-sides",
      ]
    `);
  });

  it('wraps multiplying by the denominator in an "isolate the variable" step', () => {
    expect(describeStrategies(solve('\\frac{x}{2} = 5')))
      .toMatchInlineSnapshot(`
      [
        "isolate-variable: mul 2, simplify-both-sides",
      ]
    `);
  });

  it('wraps multiplying and dividing in a single "isolate the variable" step', () => {
    expect(describeStrategies(solve('\\frac{2x}{3} = 5')))
      .toMatchInlineSnapshot(`
      [
        "isolate-variable: mul 3, simplify-both-sides, div 2, simplify-left-hand-side",
      ]
    `);
  });

  it('simplifies before moving terms', () => {
    expect(describeStrategies(solve('2x + 3x + 1 = 7 - 4')))
      .toMatchInlineSnapshot(`
      [
        "simplify-both-sides: simplify-left-hand-side, simplify-right-hand-side",
        "move-terms-to-one-side: sub 1, simplify-both-sides",
        "isolate-variable: div 5, simplify-left-hand-side",
      ]
    `);
  });

  it('has no strategy steps when the relation is already solved', () => {
    expect(describeStrategies(solve('x = 5'))).toEqual([]);
  });

  test.each([
    '2x + 5 = 10',
    '4x + 2 = 3x - 7',
    '2x - 3y - 5 = -y + 10',
    '\\frac{x}{2}+\\frac{1}{2}=\\frac{2x}{3}+\\frac{1}{3}',
    '2x + 3x + 1 = 7 - 4',
  ])('strategy steps of %s chain from before to after', (input) => {
    const result = solve(input);
    let current = print(result.before);
    for (const strategy of result.substeps) {
      expect(print(strategy.before)).toEqual(current);
      // A strategy's concrete steps also chain from its before to its after.
      if (
        strategy.kind === StepKind.MoveTermsToOneSide ||
        strategy.kind === StepKind.IsolateVariable
      ) {
        let inner = current;
        for (const substep of strategy.substeps) {
          expect(print(substep.before)).toEqual(inner);
          inner = print(substep.after);
        }
        expect(print(strategy.after)).toEqual(inner);
      }
      current = print(strategy.after);
    }
    expect(print(result.after)).toEqual(current);
  });
});
