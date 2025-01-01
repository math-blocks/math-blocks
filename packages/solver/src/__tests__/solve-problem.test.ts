import * as Semantic from '@math-blocks/semantic';

import * as Testing from '../test-util';
import { solveProblem } from '../solve-problem';

import type { Problem } from '../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('solveProblem', () => {
  it('should factor expressions', () => {
    const problem: Problem = {
      type: 'Factor',
      expression: Testing.parse('x^2 + 5x + 6') as Semantic.types.Add,
    };
    const result = solveProblem(problem)!;

    expect(Testing.print(result.answer)).toEqual('(x + 2)(x + 3)');
  });

  it('should simplify numeric expressions', () => {
    const problem: Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('3x - 2x') as Semantic.types.Node,
    };
    const result = solveProblem(problem)!;

    expect(Testing.print(result.answer)).toEqual('x');
  });

  it('should solve linear equations', () => {
    const ast = parseNumRel('2x + 5 = 10');

    const problem: Problem = {
      type: 'SolveLinearRelation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(Testing.print(result.answer)).toEqual('x = 5 / 2');
  });

  it('should solve quadratic equations', () => {
    const ast = parseNumRel('x^2 + 5x + 6 = 0');

    const problem: Problem = {
      type: 'SolveQuadraticEquation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(Testing.print(result.answer)).toEqual('x = -2, x = -3');
  });
});
