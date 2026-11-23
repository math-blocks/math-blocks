import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Testing from '../../testing';

import { showMeHow } from '../show-me-how';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('#showMeHow', () => {
  it('should work with equations', () => {
    const problem: Solver.Problem = {
      type: 'SolveLinearRelation',
      relation: parseNumRel('2x + 5 = 10'),
      variable: Semantic.builders.identifier('x'),
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(
      `"2x + 5 - 5 = 10 - 5"`,
    );
  });

  it('should work with expressions', () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('2x + 3x'),
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(`"5x"`);
  });

  it('should work with factoring', () => {
    const problem: Solver.Problem = {
      type: 'Factor',
      expression: Testing.parse('x^2 + 5x + 6') as Semantic.types.Add,
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(`"x^2 + 3x + 2x + 6"`);
  });

  it('should work with quadratic equations', () => {
    const problem: Solver.Problem = {
      type: 'SolveQuadraticEquation',
      relation: parseNumRel('x^2 + 5x + 6 = 0'),
      variable: Semantic.builders.identifier('x'),
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(`"(x + 2)(x + 3) = 0"`);
  });

  it('should work with systems of equations', () => {
    const problem: Solver.Problem = {
      type: 'SolveSystemOfEquations',
      equations: Semantic.builders.sequence([
        Testing.parse('3x - y = 6'),
        Testing.parse('x + 2y = -1'),
      ]),
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(
      `"x = 2 + y / 3, x + 2y = -1"`,
    );
  });
});
