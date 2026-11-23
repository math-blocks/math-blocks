import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Testing from '../../testing';

import { getHint } from '../get-hint';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

describe('#getHint', () => {
  it('should work with equations', () => {
    const problem: Solver.Problem = {
      type: 'SolveLinearRelation',
      relation: parseNumRel('2x + 5 = 10'),
      variable: Semantic.builders.identifier('x'),
    };

    const hint = getHint(problem);

    expect(hint.message).toMatchInlineSnapshot(
      `"do the same operation to both sides"`,
    );
  });

  it('should work with expressions', () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('2x + 3x'),
    };

    const hint = getHint(problem);

    expect(hint.message).toMatchInlineSnapshot(`"collect like terms"`);
  });

  it("should throw if there's nothing left to do", () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('x'),
    };

    expect(() => getHint(problem)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Couldn't get a hint]`,
    );
  });
});
