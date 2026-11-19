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
      expression: parse('x^2+5x+6') as Semantic.types.Add,
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"(x+2)(x+3)"`);
  });

  it('should simplify numeric expressions', () => {
    const problem: Problem = {
      type: 'SimplifyExpression',
      expression: parse('3x-2x') as Semantic.types.Node,
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x"`);
  });

  it('should solve linear equations', () => {
    const ast = parseNumRel('2x+5=10');

    const problem: Problem = {
      type: 'SolveLinearRelation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x=\\frac{5}{2}"`);
  });

  it.each([
    ['-x>2', 'x', 'x\\lt-2'],
    ['-x=3', 'x', 'x=-3'],
    ['4b+5=1+5b', 'b', 'b=4'],
  ])(
    'should solve linear relations with a coefficient of -1: %s',
    (input, variable, expected) => {
      const problem: Problem = {
        type: 'SolveLinearRelation',
        relation: parseNumRel(input),
        variable: Semantic.builders.identifier(variable),
      };
      const result = solveProblem(problem)!;

      expect(print(result.answer)).toEqual(expected);
    },
  );

  it('should solve quadratic equations', () => {
    const ast = parseNumRel('x^2+5x+6=0');

    const problem: Problem = {
      type: 'SolveQuadraticEquation',
      relation: ast,
      variable: Semantic.builders.identifier('x'),
    };
    const result = solveProblem(problem)!;

    expect(print(result.answer)).toMatchInlineSnapshot(`"x=-2, x=-3"`);
  });
});
