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
  | StepType<'test', TNode>; // this last one is only used in tests

export type Solution<T extends Semantic.types.Node = Semantic.types.Node> = {
  readonly steps: readonly Step<Semantic.types.Node>[];
  readonly answer: T;
};

// TODO: Rename this to 'SolveNumericRelation' or something like that
type SolveEquation = {
  readonly type: 'SolveEquation';
  readonly equation: Semantic.types.NumericRelation;
  readonly variable: Semantic.types.Identifier;
};

type SimplifyExpression = {
  readonly type: 'SimplifyExpression';
  readonly expression: Semantic.types.NumericNode;
};

export type Problem = SolveEquation | SimplifyExpression;
