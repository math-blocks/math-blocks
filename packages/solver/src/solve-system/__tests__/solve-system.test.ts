import { builders, types } from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { solveSystem } from '../solve-system';
import { NumberOfSolutions } from '../../types';

const parseEqn = (input: string): types.Eq => {
  return Testing.parse(input) as types.Eq;
};

describe('solveSystem', () => {
  it('3x - y = 6, x + 2y = -1', () => {
    const eqn1 = parseEqn('3x - y = 6');
    const eqn2 = parseEqn('x + 2y = -1');
    const result = solveSystem(builders.sequence([eqn1, eqn2]))!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);
    expect(steps).toMatchInlineSnapshot(`
      [
        "3x - y = 6, x + 2y = -1",
        "3x - y = 6 => x = 2 + y / 3",
        "x + 2y = -1 => (2 + y / 3) + 2y = -1",
        "(2 + y / 3) + 2y = -1 => y = -(9 / 7)",
        "x = 2 + y / 3 => x = 2 + -(9 / 7) / 3",
        "x = 2 + -(9 / 7) / 3 => x = 11 / 7",
        "y = -(9 / 7), x = 11 / 7",
      ]
    `);
  });

  it('3u - v = 6, u + 2v = -1 (different identifiers)', () => {
    const eqn1 = parseEqn('3u - v = 6');
    const eqn2 = parseEqn('u + 2v = -1');
    const result = solveSystem(builders.sequence([eqn1, eqn2]))!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);
    expect(steps).toMatchInlineSnapshot(`
      [
        "3u - v = 6, u + 2v = -1",
        "3u - v = 6 => u = 2 + v / 3",
        "u + 2v = -1 => (2 + v / 3) + 2v = -1",
        "(2 + v / 3) + 2v = -1 => v = -(9 / 7)",
        "u = 2 + v / 3 => u = 2 + -(9 / 7) / 3",
        "u = 2 + -(9 / 7) / 3 => u = 11 / 7",
        "v = -(9 / 7), u = 11 / 7",
      ]
    `);
  });

  it('6 = 3x - y, -1 = x + 2y (lhs and rhs of equations is swapped)', () => {
    const eqn1 = parseEqn('6 = 3x - y');
    const eqn2 = parseEqn('-1 = x + 2y');
    const result = solveSystem(builders.sequence([eqn1, eqn2]))!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.One);
    expect(steps).toMatchInlineSnapshot(`
      [
        "6 = 3x - y, -1 = x + 2y",
        "6 = 3x - y => 2 + y / 3 = x",
        "-1 = x + 2y => -1 = (2 + y / 3) + 2y",
        "-1 = (2 + y / 3) + 2y => -(9 / 7) = y",
        "2 + y / 3 = x => 2 + -(9 / 7) / 3 = x",
        "2 + -(9 / 7) / 3 = x => 11 / 7 = x",
        "-(9 / 7) = y, 11 / 7 = x",
      ]
    `);
  });

  it('y = 2x + 4, y = 2x - 2 (parallel lines)', () => {
    const eqn1 = parseEqn('y = 2x + 4');
    const eqn2 = parseEqn('y = 2x - 2');
    const result = solveSystem(builders.sequence([eqn1, eqn2]))!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.None);
    expect(steps).toMatchInlineSnapshot(`
      [
        "y = 2x + 4, y = 2x - 2",
        "y = 2x + 4 => y / 2 - 2 = x",
        "y = 2x - 2 => y = 2(y / 2 - 2) - 2",
        "y = 2(y / 2 - 2) - 2 => 0 = -6",
        "y / 2 - 2 = x => y / 2 - 2 = x",
        "0 = -6, y / 2 - 2 = x",
      ]
    `);
  });

  it('y = -2x + 1, 2x + y = 1 (same line)', () => {
    const eqn1 = parseEqn('y = -2x + 1');
    const eqn2 = parseEqn('2x + y = 1');
    const result = solveSystem(builders.sequence([eqn1, eqn2]))!;

    const steps = [
      Testing.print(result.before),
      ...result.substeps.map((step) => {
        const before = Testing.print(step.before);
        const after = Testing.print(step.after);
        return `${before} => ${after}`;
      }),
      Testing.print(result.after),
    ];

    expect(result.numberOfSolutions).toEqual(NumberOfSolutions.Infinite);
    expect(steps).toMatchInlineSnapshot(`
      [
        "y = -2x + 1, 2x + y = 1",
        "y = -2x + 1 => -(y / 2) + 1 / 2 = x",
        "2x + y = 1 => 2(-(y / 2) + 1 / 2) + y = 1",
        "2(-(y / 2) + 1 / 2) + y = 1 => 1 = 1",
        "-(y / 2) + 1 / 2 = x => -(y / 2) + 1 / 2 = x",
        "1 = 1, -(y / 2) + 1 / 2 = x",
      ]
    `);
  });

  describe('bail-out cases', () => {
    it('should not try to solve quadratic equations', () => {
      const eqn1 = parseEqn('x^2 + y = 6');
      const eqn2 = parseEqn('x + 2y = -1');
      const result = solveSystem(builders.sequence([eqn1, eqn2]));

      expect(result).toBeUndefined();
    });

    it('should not try to solve rational equations', () => {
      const eqn1 = parseEqn('3/x - y = 6');
      const eqn2 = parseEqn('x + 2y = -1');
      const result = solveSystem(builders.sequence([eqn1, eqn2]));

      expect(result).toBeUndefined();
    });

    it('should not try to solve systems of equations with more than two variables', () => {
      const eqn1 = parseEqn('3x - y = 6');
      const eqn2 = parseEqn('x + 2y + z = -1');
      const result = solveSystem(builders.sequence([eqn1, eqn2]));

      expect(result).toBeUndefined();
    });

    it('should not try to solve systems with more than two equations', () => {
      const eqn1 = parseEqn('3x - y = 6');
      const eqn2 = parseEqn('x + 2y = -1');
      const eqn3 = parseEqn('z = 0');
      const result = solveSystem(builders.sequence([eqn1, eqn2, eqn3]));

      expect(result).toBeUndefined();
    });

    it("should return if the sequence doesn't contain equations", () => {
      const expr1 = Testing.parse('3x - y');
      const expr2 = Testing.parse('x + 2y');
      const result = solveSystem(builders.sequence([expr1, expr2]));

      expect(result).toBeUndefined();
    });
  });
});
