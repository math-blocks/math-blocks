/* oxlint-disable typescript/ban-types */
import * as Semantic from '@math-blocks/semantic';

export enum NumberOfSolutions {
  None = 0,
  One = 1,
  Infinite = -1,
}

/**
 * Stable identifiers for every kind of `Step` the solver produces.  Use
 * `step.kind` (not `step.message`) to tell steps apart, e.g.
 * `switch (step.kind) { case StepKind.ReduceFraction: ... }`.
 *
 * Stability promise: this enum is public API.  New values may be added in any
 * release, so callers that switch over it should handle unknown values
 * gracefully if they don't use exhaustive type checking.  Existing members and
 * their string values will never be renamed, removed, or reused for a
 * different kind of step.
 *
 * The string values are identifiers, not prose, and are not meant to be shown
 * to students.  Callers own the wording (and translation) of any text they
 * display for a step.
 */
export enum StepKind {
  // simplify
  SimplifyExpression = 'simplify-expression',
  AddingInverseIsSubtraction = 'adding-inverse-is-subtraction',
  CollectLikeTerms = 'collect-like-terms',
  SubtractionIsAddingInverse = 'subtraction-is-adding-inverse',
  ReorderLikeTerms = 'reorder-like-terms',
  FactorVariablePartOfLikeTerms = 'factor-variable-part-of-like-terms',
  ComputeNewCoefficients = 'compute-new-coefficients',
  SimplifyTerms = 'simplify-terms',
  DistributeDivision = 'distribute-division',
  NegationIsMultiplyingByNegativeOne = 'negation-is-multiplying-by-negative-one',
  MultiplyEachTerm = 'multiply-each-term',
  Distribute = 'distribute',
  DropAddingZero = 'drop-adding-zero',
  DropPowerOfOne = 'drop-power-of-one',
  DropParentheses = 'drop-parentheses',
  EvaluateMultiplication = 'evaluate-multiplication',
  EvaluateAddition = 'evaluate-addition',
  EvaluateDivision = 'evaluate-division',
  DividingByFractionIsMultiplyingByReciprocal = 'dividing-by-fraction-is-multiplying-by-reciprocal',
  MultiplyingByZeroIsZero = 'multiplying-by-zero-is-zero',
  MultiplyingTwoNegativesIsPositive = 'multiplying-two-negatives-is-positive',
  MultiplyingNegativeByPositiveIsNegative = 'multiplying-negative-by-positive-is-negative',
  MultiplyFractions = 'multiply-fractions',
  MultiplyMonomials = 'multiply-monomials',
  MultiplyPowers = 'multiply-powers',
  DividePowers = 'divide-powers',
  RepeatedMultiplicationIsPower = 'repeated-multiplication-is-power',
  PowerIsRepeatedMultiplication = 'power-is-repeated-multiplication',
  ExpandPower = 'expand-power',
  ReduceFraction = 'reduce-fraction',
  SimplifyMultiplication = 'simplify-multiplication',

  // linear equations
  SolveForVariable = 'solve-for-variable',
  DoSameOperationToBothSides = 'do-same-operation-to-both-sides',
  MoveTermsToOneSide = 'move-terms-to-one-side',
  MoveMatchingVariableTermsToOneSide = 'move-matching-variable-terms-to-one-side',
  MoveOtherTermsToOtherSide = 'move-other-terms-to-other-side',
  SimplifyBothSides = 'simplify-both-sides',
  SimplifyLeftHandSide = 'simplify-left-hand-side',
  SimplifyRightHandSide = 'simplify-right-hand-side',

  // quadratics and factoring
  FactorQuadratic = 'factor-quadratic',
  SolveQuadratic = 'solve-quadratic',
  SplitFactoredEquation = 'split-factored-equation',
  SplitLinearTerm = 'split-linear-term',
  Factor = 'factor',

  // systems of equations
  SolveSystem = 'solve-system',
  Substitute = 'substitute',

  // differentiation
  Differentiate = 'differentiate',
  PowerRule = 'power-rule',
  ProductRule = 'product-rule',
  QuotientRule = 'quotient-rule',
  ChainRule = 'chain-rule',
}

type StepType<
  TKind extends StepKind,
  TMessage extends string,
  TNode extends Semantic.types.Node,
  Options extends Record<string, unknown> = {},
> = {
  /**
   * Identifies what this step does.  This is the discriminant of `Step`.
   */
  readonly kind: TKind;
  /**
   * An English description of the step, kept only as a debug label.
   *
   * @deprecated use `kind` instead.  `message` will be removed in a future
   * release, and its text is not stable or translatable.
   */
  readonly message: TMessage;
  readonly before: TNode;
  readonly after: TNode;
  readonly substeps: readonly Step<TNode>[];
  readonly section?: boolean;
} & Options;

export type Side = 'left' | 'right';

/**
 * A single step in a solution, discriminated by `kind` (see `StepKind`).
 */
export type Step<TNode extends Semantic.types.Node = Semantic.types.Node> =
  | StepType<StepKind.SimplifyExpression, 'simplify expression', TNode>
  | StepType<
      StepKind.AddingInverseIsSubtraction,
      'adding the inverse is the same as subtraction',
      TNode
    >
  | StepType<StepKind.CollectLikeTerms, 'collect like terms', TNode>
  | StepType<
      StepKind.SubtractionIsAddingInverse,
      'subtraction is the same as adding the inverse',
      TNode
    >
  | StepType<
      StepKind.ReorderLikeTerms,
      'reorder terms so that like terms are beside each other',
      TNode
    >
  | StepType<
      StepKind.FactorVariablePartOfLikeTerms,
      'factor variable part of like terms',
      TNode
    >
  | StepType<StepKind.ComputeNewCoefficients, 'compute new coefficients', TNode>
  | StepType<StepKind.SimplifyTerms, 'simplify terms', TNode>
  | StepType<StepKind.DistributeDivision, 'distribute division', TNode>
  | StepType<
      StepKind.NegationIsMultiplyingByNegativeOne,
      'negation is the same as multiplying by negative one',
      TNode
    >
  | StepType<StepKind.MultiplyEachTerm, 'multiply each term', TNode>
  | StepType<StepKind.Distribute, 'distribute', TNode>
  | StepType<StepKind.DropAddingZero, 'drop adding zero', TNode> // additive identity
  | StepType<StepKind.DropPowerOfOne, 'drop power of one', TNode>
  | StepType<StepKind.DropParentheses, 'drop parentheses', TNode>
  | StepType<StepKind.EvaluateMultiplication, 'evaluate multiplication', TNode>
  | StepType<StepKind.EvaluateAddition, 'evaluate addition', TNode>
  | StepType<StepKind.EvaluateDivision, 'evaluate division', TNode>
  | StepType<
      StepKind.DividingByFractionIsMultiplyingByReciprocal,
      'dividing by a fraction is the same as multiplyin by the reciprocal',
      TNode
    >
  | StepType<
      StepKind.MultiplyingByZeroIsZero,
      'multiplying by zero is equivalent to zero',
      TNode
    >
  | StepType<
      StepKind.MultiplyingTwoNegativesIsPositive,
      'multiplying two negatives is a positive',
      TNode
    >
  | StepType<
      StepKind.MultiplyingNegativeByPositiveIsNegative,
      'multiplying a negative by a positive is negative',
      TNode
    >
  | StepType<StepKind.MultiplyFractions, 'multiply fraction(s)', TNode>
  | StepType<StepKind.MultiplyMonomials, 'multiply monomials', TNode>
  | StepType<StepKind.MultiplyPowers, 'multiply powers', TNode>
  | StepType<StepKind.DividePowers, 'divide powers', TNode>
  | StepType<
      StepKind.RepeatedMultiplicationIsPower,
      'repeated multiplication can be written as a power',
      TNode
    >
  | StepType<
      StepKind.PowerIsRepeatedMultiplication,
      'a power is repeated multiplication',
      TNode
    >
  | StepType<StepKind.ExpandPower, 'expand power', TNode>
  | StepType<StepKind.ReduceFraction, 'reduce fraction', TNode>
  | StepType<StepKind.SimplifyMultiplication, 'simplify multiplication', TNode>
  | StepType<
      StepKind.SolveForVariable,
      'solve for variable',
      TNode,
      { readonly numberOfSolutions: NumberOfSolutions }
    >
  | StepType<
      StepKind.DoSameOperationToBothSides,
      'do the same operation to both sides',
      TNode,
      {
        readonly operation: 'add' | 'sub' | 'mul' | 'div';
        readonly value: Semantic.types.Node;
      }
    >
  | StepType<StepKind.MoveTermsToOneSide, 'move terms to one side', TNode>
  | StepType<
      StepKind.MoveMatchingVariableTermsToOneSide,
      'move matching variable terms to one side',
      TNode,
      { readonly side: Side }
    >
  | StepType<
      StepKind.MoveOtherTermsToOtherSide,
      'move other terms to the other side',
      TNode,
      { readonly side: Side }
    >
  | StepType<StepKind.SimplifyBothSides, 'simplify both sides', TNode>
  | StepType<
      StepKind.SimplifyLeftHandSide,
      'simplify the left hand side',
      TNode
    >
  | StepType<
      StepKind.SimplifyRightHandSide,
      'simplify the right hand side',
      TNode
    >
  | StepType<StepKind.FactorQuadratic, 'factor quadratic', TNode>
  | StepType<StepKind.SolveQuadratic, 'solve quadratic', TNode>
  | StepType<
      StepKind.SolveSystem,
      'solve system',
      TNode,
      { readonly numberOfSolutions: NumberOfSolutions }
    >
  | StepType<
      StepKind.Substitute,
      'substitute',
      TNode,
      { readonly original: TNode; readonly substitution: TNode }
    >
  | StepType<StepKind.SplitFactoredEquation, 'split factored equation', TNode>
  | StepType<StepKind.SplitLinearTerm, 'split linear term', TNode>
  | StepType<StepKind.Factor, 'factor', TNode> // TODO: update this to say what factor we're extract from an expression
  | StepType<StepKind.Differentiate, 'differentiate', TNode>
  | StepType<StepKind.PowerRule, 'power rule', TNode>
  | StepType<StepKind.ProductRule, 'product rule', TNode>
  | StepType<StepKind.QuotientRule, 'quotient rule', TNode>
  | StepType<StepKind.ChainRule, 'chain rule', TNode>;

// TODO: update to support multiple parts
export type Solution<T extends Semantic.types.Node = Semantic.types.Node> = {
  readonly steps: readonly Step[];
  readonly answer: T;
};

type Factor = {
  readonly type: 'Factor';
  readonly expression: Semantic.types.Add;
};

type SimplifyExpression = {
  readonly type: 'SimplifyExpression';
  readonly expression: Semantic.types.Node;
};

type SolveLinearRelation = {
  readonly type: 'SolveLinearRelation';
  readonly relation: Semantic.types.NumericRelation;
  readonly variable: Semantic.types.Identifier;
};

type SolveQuadraticEquation = {
  readonly type: 'SolveQuadraticEquation';
  readonly relation: Semantic.types.NumericRelation;
  readonly variable: Semantic.types.Identifier;
};

type SolveSystemOfEquations = {
  readonly type: 'SolveSystemOfEquations';
  readonly equations: Semantic.types.Sequence;
};

export type Problem =
  | Factor
  | SimplifyExpression
  | SolveLinearRelation
  | SolveQuadraticEquation
  | SolveSystemOfEquations;

export type Transform = (
  node: Semantic.types.Node,
  path: readonly Semantic.types.Node[],
  simplify: Transform,
) => Step | void;
