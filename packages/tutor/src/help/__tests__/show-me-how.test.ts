import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Testing from '@math-blocks/testing';

import { showMeHow } from '../show-me-how';

const parseEq = (input: string): Semantic.types.Eq => {
  return Testing.parse(input) as Semantic.types.Eq;
};

describe('#showMeHow', () => {
  it('should work with equations', () => {
    const problem: Solver.Problem = {
      type: 'SolveEquation',
      equation: parseEq('2x + 5 = 10'),
      variable: Semantic.builders.identifier('x'),
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(`"2x = 5"`);
  });

  it('should work with expressions', () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('2x + 3x') as Semantic.types.NumericNode,
    };

    const result = showMeHow(problem);

    expect(Testing.print(result)).toMatchInlineSnapshot(`"5x"`);
  });
});
