import * as Semantic from '@math-blocks/semantic';
import * as Testing from '@math-blocks/testing';

import { solveProblem } from '../solve-problem';

import type { Problem } from '../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('solveProblem', () => {
  it('should solve linear equations', () => {
    const ast = parseNumRel('2x + 5 = 10');

    const problem: Problem = {
      type: 'SolveLinearRelation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem);

    if (!result) {
      throw new Error("the equation couldn't be solved");
    }
    expect(Testing.print(result.answer)).toEqual('x = 5 / 2');
  });

  it('should simplify numeric expressions', () => {
    const problem: Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('3x - 2x') as Semantic.types.Node,
    };
    const result = solveProblem(problem);

    if (!result) {
      throw new Error("the expression couldn't be simplified");
    }
    expect(Testing.print(result.answer)).toEqual('x');
  });
});
