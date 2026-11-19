import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Testing from '../../testing';
import { StepKind } from '../../index';

import { getHint } from '../get-hint';

const parseNumRel = (input: string): Semantic.types.NumericRelation => {
  return Testing.parse(input) as Semantic.types.NumericRelation;
};

const linearProblem = (input: string): Solver.Problem => ({
  type: 'SolveLinearRelation',
  relation: parseNumRel(input),
  variable: Semantic.builders.identifier('x'),
});

// Describes a 'do the same operation to both sides' step, e.g. "sub 5".
const describeOperation = (step: Solver.Step): string => {
  if (step.kind !== StepKind.DoSameOperationToBothSides) {
    return step.kind;
  }
  return `${step.operation} ${Testing.print(step.value)}`;
};

describe('#getHint', () => {
  it('should work with equations', () => {
    const hint = getHint(linearProblem('2x + 5 = 10'));

    // The strategy: move the 5 to the other side...
    expect(hint.strategy?.kind).toEqual(StepKind.MoveTermsToOneSide);
    // ...by subtracting 5 from both sides.
    expect(hint.step.kind).toEqual(StepKind.DoSameOperationToBothSides);
    expect(describeOperation(hint.step)).toEqual('sub 5');
    expect(hint.strategy?.substeps[0]).toBe(hint.step);
    expect(Testing.print(hint.step.after)).toMatchInlineSnapshot(
      `"2x + 5 - 5 = 10 - 5"`,
    );
  });

  it('should move terms when there are variables on both sides', () => {
    const hint = getHint(linearProblem('4x + 2 = 3x - 7'));

    expect(hint.strategy?.kind).toEqual(StepKind.MoveTermsToOneSide);
    expect(describeOperation(hint.step)).toEqual('sub 2');
  });

  it('should move terms by adding', () => {
    const hint = getHint(linearProblem('x - 5 = 10'));

    expect(hint.strategy?.kind).toEqual(StepKind.MoveTermsToOneSide);
    expect(describeOperation(hint.step)).toEqual('add 5');
  });

  it('should isolate the variable by dividing', () => {
    const hint = getHint(linearProblem('2x = 10'));

    expect(hint.strategy?.kind).toEqual(StepKind.IsolateVariable);
    expect(describeOperation(hint.step)).toEqual('div 2');
  });

  it('should isolate the variable by multiplying', () => {
    const hint = getHint(linearProblem('x/2 = 5'));

    expect(hint.strategy?.kind).toEqual(StepKind.IsolateVariable);
    expect(describeOperation(hint.step)).toEqual('mul 2');
  });

  it('should simplify before solving', () => {
    const hint = getHint(linearProblem('2x + 3x = 10'));

    expect(hint.strategy?.kind).toEqual(StepKind.SimplifyLeftHandSide);
    expect(hint.step.kind).toEqual(StepKind.CollectLikeTerms);
  });

  it('should work with expressions', () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('2x + 3x') as Semantic.types.Node,
    };

    const hint = getHint(problem);

    expect(hint.strategy).toBeNull();
    expect(hint.step.kind).toEqual(StepKind.CollectLikeTerms);
    expect(hint.step.message).toMatchInlineSnapshot(`"collect like terms"`);
  });

  it('re-exports the same StepKind as @math-blocks/solver', () => {
    expect(StepKind).toBe(Solver.StepKind);
  });

  it("should throw if there's nothing left to do", () => {
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: Testing.parse('x') as Semantic.types.Node,
    };

    expect(() => getHint(problem)).toThrowErrorMatchingInlineSnapshot(
      `"Couldn't get a hint"`,
    );
  });

  it('should throw if the equation is already solved', () => {
    expect(() => getHint(linearProblem('x = 5'))).toThrowError(
      "Couldn't get a hint",
    );
  });
});
