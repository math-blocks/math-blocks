import * as Semantic from '@math-blocks/semantic';

import { parse } from '../test-util';
import { solveProblem } from '../solve-problem';
import { Step, StepKind } from '../types';
import type { Problem } from '../types';

// Compile-time check: `kind` is the discriminant of `Step`, so switching over
// it narrows the step and the `never` assignment fails to type check if a
// `StepKind` is missing from the switch.
const describeKind = (step: Step): string => {
  switch (step.kind) {
    case StepKind.SimplifyExpression:
    case StepKind.AddingInverseIsSubtraction:
    case StepKind.CollectLikeTerms:
    case StepKind.SubtractionIsAddingInverse:
    case StepKind.ReorderLikeTerms:
    case StepKind.FactorVariablePartOfLikeTerms:
    case StepKind.ComputeNewCoefficients:
    case StepKind.SimplifyTerms:
    case StepKind.DistributeDivision:
    case StepKind.NegationIsMultiplyingByNegativeOne:
    case StepKind.MultiplyEachTerm:
    case StepKind.Distribute:
    case StepKind.DropAddingZero:
    case StepKind.DropPowerOfOne:
    case StepKind.DropParentheses:
    case StepKind.EvaluateMultiplication:
    case StepKind.EvaluateAddition:
    case StepKind.EvaluateDivision:
    case StepKind.DividingByFractionIsMultiplyingByReciprocal:
    case StepKind.MultiplyingByZeroIsZero:
    case StepKind.MultiplyingTwoNegativesIsPositive:
    case StepKind.MultiplyingNegativeByPositiveIsNegative:
    case StepKind.MultiplyFractions:
    case StepKind.MultiplyMonomials:
    case StepKind.MultiplyPowers:
    case StepKind.DividePowers:
    case StepKind.RepeatedMultiplicationIsPower:
    case StepKind.PowerIsRepeatedMultiplication:
    case StepKind.ExpandPower:
    case StepKind.ReduceFraction:
    case StepKind.SimplifyMultiplication:
    case StepKind.MoveTermsToOneSide:
    case StepKind.SimplifyBothSides:
    case StepKind.SimplifyLeftHandSide:
    case StepKind.SimplifyRightHandSide:
    case StepKind.IsolateVariable:
    case StepKind.FactorQuadratic:
    case StepKind.SolveQuadratic:
    case StepKind.SplitFactoredEquation:
    case StepKind.SplitLinearTerm:
    case StepKind.Factor:
    case StepKind.Differentiate:
    case StepKind.PowerRule:
    case StepKind.ProductRule:
    case StepKind.QuotientRule:
    case StepKind.ChainRule:
      return step.kind;
    case StepKind.SolveForVariable:
    case StepKind.SolveSystem:
      return `${step.kind} (${step.numberOfSolutions})`;
    case StepKind.DoSameOperationToBothSides:
      return `${step.kind} (${step.operation})`;
    case StepKind.MoveMatchingVariableTermsToOneSide:
    case StepKind.MoveOtherTermsToOtherSide:
      return `${step.kind} (${step.side})`;
    case StepKind.Substitute:
      return `${step.kind} (${step.substitution.type})`;
    default: {
      const unreachable: never = step;
      return unreachable;
    }
  }
};

const allSteps = (steps: readonly Step[]): Step[] =>
  steps.flatMap((step) => [step, ...allSteps(step.substeps)]);

const kindValues = Object.values(StepKind);

describe('StepKind', () => {
  test('values are unique, non-prose identifiers', () => {
    expect(new Set(kindValues).size).toEqual(kindValues.length);
    for (const value of kindValues) {
      expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  test.each<[string, Problem]>([
    [
      'SolveLinearRelation',
      {
        type: 'SolveLinearRelation',
        relation: parse('2x + 5 = 3x - 7') as Semantic.types.NumericRelation,
        variable: Semantic.builders.identifier('x'),
      },
    ],
    [
      'SimplifyExpression',
      {
        type: 'SimplifyExpression',
        expression: parse('2(x + 3) - (x - 1) + 6 / 3'),
      },
    ],
    [
      'Factor',
      {
        type: 'Factor',
        expression: parse('x^2 + 5x + 6') as Semantic.types.Add,
      },
    ],
    [
      'SolveQuadraticEquation',
      {
        type: 'SolveQuadraticEquation',
        relation: parse('x^2 + 5x + 6 = 0') as Semantic.types.NumericRelation,
        variable: Semantic.builders.identifier('x'),
      },
    ],
    [
      'SolveSystemOfEquations',
      {
        type: 'SolveSystemOfEquations',
        equations: Semantic.builders.sequence([
          parse('3x - y = 6'),
          parse('x + 2y = -1'),
        ]),
      },
    ],
  ])('every step from %s has a known kind', (_, problem) => {
    const solution = solveProblem(problem);
    if (!solution) {
      throw new Error('expected a solution');
    }
    const steps = allSteps(solution.steps);
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(kindValues).toContain(step.kind);
      expect(typeof describeKind(step)).toEqual('string');
    }
  });

  test('message is still set (deprecated) and matches the kind', () => {
    const solution = solveProblem({
      type: 'SolveLinearRelation',
      relation: parse('2x + 5 = 10') as Semantic.types.NumericRelation,
      variable: Semantic.builders.identifier('x'),
    });
    const step = solution?.steps[0];
    expect(step?.kind).toEqual(StepKind.SolveForVariable);
    expect(step?.message).toEqual('solve for variable');
  });
});
