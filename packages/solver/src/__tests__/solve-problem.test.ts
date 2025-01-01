import * as Semantic from '@math-blocks/semantic';

import { parse, print } from '../test-util';
import { solveProblem } from '../solve-problem';

import type { Problem } from '../types';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return parse(input) as Semantic.types.NumericRelation;
};

describe('solveProblem', () => {
  it('should factor expressions', () => {
    const problem: Problem = {
      type: 'Factor',
      expression: parse('x^2 + 5x + 6') as Semantic.types.Add,
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"(x + 2)(x + 3)"`);
  });

  it('should simplify numeric expressions', () => {
    const problem: Problem = {
      type: 'SimplifyExpression',
      expression: parse('3x - 2x') as Semantic.types.Node,
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x"`);
  });

  it('should solve linear equations', () => {
    const ast = parseNumRel('2x + 5 = 10');

    const problem: Problem = {
      type: 'SolveLinearRelation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x = 5 / 2"`);
  });

  it('should solve quadratic equations', () => {
    const ast = parseNumRel('x^2 + 5x + 6 = 0');

    const problem: Problem = {
      type: 'SolveQuadraticEquation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x = -2, x = -3"`);
  });
});
