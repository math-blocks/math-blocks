/* eslint-disable @typescript-eslint/ban-types */
import * as Semantic from '@math-blocks/semantic';

type StepType<
  TMessage extends string,
  TNode extends Semantic.types.Node,
  Options extends Record<string, unknown> = {},
> = {
  readonly message: TMessage;
  readonly before: TNode;
  readonly after: TNode;
  readonly substeps: readonly Step<TNode>[];
} & Options;

export type Side = 'left' | 'right';

export type Step<TNode extends Semantic.types.Node = Semantic.types.Node> =
  | StepType<'simplify expression', TNode>
  | StepType<'adding the inverse is the same as subtraction', TNode>
  | StepType<'collect like terms', TNode>
  | StepType<'subtraction is the same as adding the inverse', TNode>
  | StepType<'reorder terms so that like terms are beside each other', TNode>
  | StepType<'factor variable part of like terms', TNode>
  | StepType<'compute new coefficients', TNode>
  | StepType<'simplify terms', TNode>
  | StepType<'distribute division', TNode>
  | StepType<'negation is the same as multiplying by negative one', TNode>
  | StepType<'multiply each term', TNode>
  | StepType<'distribute', TNode>
  | StepType<'drop adding zero', TNode> // additive identity
  | StepType<'drop parentheses', TNode>
  | StepType<'evaluate multiplication', TNode>
  | StepType<'evaluate addition', TNode>
  | StepType<'evaluate division', TNode>
  | StepType<
      'dividing by a fraction is the same as multiplyin by the reciprocal',
      TNode
    >
  | StepType<'multiplying by zero is equivalent to zero', TNode>
  | StepType<'multiplying two negatives is a positive', TNode>
  | StepType<'multiplying a negative by a positive is negative', TNode>
  | StepType<'multiply fraction(s)', TNode>
  | StepType<'multiply monomials', TNode>
  | StepType<'repeated multiplication can be written as a power', TNode>
  | StepType<'reduce fraction', TNode>
  | StepType<'simplify multiplication', TNode>
  | StepType<'solve for variable', TNode>
  // TODO: combine all of these into a single step type
  | StepType<
      'do the same operation to both sides',
      TNode,
      {
        readonly operation: 'add' | 'sub' | 'mul' | 'div';
        readonly value: Semantic.types.NumericNode;
      }
    >
  | StepType<'move terms to one side', TNode>
  | StepType<
      'move matching variable terms to one side',
      TNode,
      { readonly side: Side }
    >
  | StepType<
      'move other terms to the other side',
      TNode,
      { readonly side: Side }
    >
  | StepType<'simplify both sides', TNode>
  | StepType<'simplify the left hand side', TNode>
  | StepType<'simplify the right hand side', TNode>
  | StepType<'multiplication of fractions', TNode> // @math-blocks/tutor
  | StepType<'fraction decomposition', TNode> // @math-blocks/tutor
  | StepType<'cancelling in fractions', TNode> // @math-blocks/tutor
  | StepType<'division by one', TNode> // @math-blocks/tutor
  | StepType<'multiplying the inverse', TNode> // @math-blocks/tutor
  | StepType<'division is multiplication by a fraction', TNode> // @math-blocks/tutor
  | StepType<
      'dividing by a fraction is the same as multiplying by the reciprocal',
      TNode
    > // @math-blocks/tutor
  | StepType<'negative of a negative is positive', TNode> // @math-blocks/tutor
  | StepType<'subtracting is the same as adding the inverse', TNode> // @math-blocks/tutor
  | StepType<'negation is the same as multipling by negative one', TNode> // @math-blocks/tutor
  | StepType<'a positive is the same as multiplying two negatives', TNode> // @math-blocks/tutor
  | StepType<'move negative to first factor', TNode> // @math-blocks/tutor
  | StepType<'move negation inside multiplication', TNode> // @math-blocks/tutor
  | StepType<'move negation out of multiplication', TNode> // @math-blocks/tutor
  | StepType<'adding inverse', TNode> // @math-blocks/tutor
  | StepType<'addition with identity', TNode> // @math-blocks/tutor
  | StepType<'multiplication with identity', TNode> // @math-blocks/tutor
  | StepType<'multiplication by zero', TNode> // @math-blocks/tutor
  | StepType<'commutative property', TNode> // @math-blocks/tutor
  | StepType<'associative property of multiplication', TNode> // @math-blocks/tutor
  | StepType<'associative property of addition', TNode> // @math-blocks/tutor
  | StepType<'multiplying a factor n-times is an exponent', TNode> // @math-blocks/tutor
  | StepType<'a power is the same as multiplying the base n times', TNode> // @math-blocks/tutor
  | StepType<'multiplying powers adds their exponents', TNode> // @math-blocks/tutor
  | StepType<'dividing powers subtracts their exponents', TNode> // @math-blocks/tutor
  | StepType<
      'One over the power is the same a power with same base but the negative of the same exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<
      'raising a power to another exponent is the same raising the power once an multiplying the exponents',
      TNode
    > // @math-blocks/tutor
  | StepType<
      'A product raised to a exponent is the same as raising each factor to that exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<
      'A product of powers raised to the same exponent are equal to the product of bases raised to that exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<
      'A fraction raised to a exponent is the same a fraction with the numerator and denominator each raised to that exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<
      'A quotient of powers raised to the same exponent are equal to the quotient of bases raised to that exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<'anything raised to 0 is equal to 1', TNode> // @math-blocks/tutor
  | StepType<'raising something to the 1st power is a no-op', TNode> // @math-blocks/tutor
  | StepType<'1 raised to any power is equal to 1', TNode> // @math-blocks/tutor
  | StepType<'0 raised to any power (except for 0) is 0', TNode> // @math-blocks/tutor
  | StepType<'symmetric property', TNode> // @math-blocks/tutor
  | StepType<'decompose sum', TNode> // @math-blocks/tutor
  | StepType<'decompose product', TNode> // @math-blocks/tutor
  | StepType<'distribution', TNode> // @math-blocks/tutor
  | StepType<'factoring', TNode> // @math-blocks/tutor
  | StepType<'evaluation of addition', TNode> // @math-blocks/tutor
  | StepType<'evaluation of multiplication', TNode> // @math-blocks/tutor
  | StepType<'evaluate sum', TNode> // @math-blocks/tutor
  | StepType<'evaluate coefficient', TNode> // @math-blocks/tutor
  | StepType<
      'A power with a negative exponent is the same as one over the power with the positive exponent',
      TNode
    > // @math-blocks/tutor
  | StepType<'adding the same value to both sides', TNode> // @math-blocks/tutor
  | StepType<'removing adding the same value to both sides', TNode> // @math-blocks/tutor
  | StepType<'multiply both sides by the same value', TNode> // @math-blocks/tutor
  | StepType<'remove multiplication from both sides', TNode> // @math-blocks/tutor
  | StepType<'divide both sides by the same value', TNode> // @math-blocks/tutor
  | StepType<'remove division by the same amount', TNode> // @math-blocks/tutor
  | StepType<'test', TNode>; // this last one is only used in tests

export type Solution<T extends Semantic.types.Node = Semantic.types.Node> = {
  readonly steps: readonly Step<Semantic.types.Node>[];
  readonly answer: T;
};

type SolveEquation = {
  readonly type: 'SolveEquation';
  readonly equation: Semantic.types.Eq;
  readonly variable: Semantic.types.Identifier;
};

type SimplifyExpression = {
  readonly type: 'SimplifyExpression';
  readonly expression: Semantic.types.NumericNode;
};

export type Problem = SolveEquation | SimplifyExpression;
