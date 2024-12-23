import { types, builders } from '@math-blocks/semantic';
import { print, parse } from '@math-blocks/testing';

import { solveLinear } from '../solve-linear-v2';

const parseNumRel = (input: string): types.NumericRelation => {
  return parse(input) as types.NumericRelation;
};

// TODO: copy the test cases from solve.test.ts
describe('solveLinear', () => {
  it('2x + y - 5 = -y + 10', () => {
    const before = parseNumRel('2x - 3y - 5 = -y + 10');
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"x = y + 15 / 2"`);

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

  it('-y + 10 = 2x + y - 5 (reversed)', () => {
    const before = parseNumRel('-y + 10 = 2x - 3y - 5');
    print(before); // ?
    const ident = builders.identifier('x');
    const result = solveLinear(before, ident)!;

    expect(print(result.after)).toMatchInlineSnapshot(`"y + 15 / 2 = x"`);

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

  describe('bail-out cases', () => {});
});
