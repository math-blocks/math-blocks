import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import { MistakeId } from './enums';

/**
 * Messages for the steps that the grader reports. These describe the
 * individual properties and rules a student may have applied, which are
 * finer-grained than the steps the solver produces.
 */
export type GraderStepMessage =
  | 'multiplication of fractions'
  | 'fraction decomposition'
  | 'cancelling in fractions'
  | 'division by one'
  | 'multiplying the inverse'
  | 'division is multiplication by a fraction'
  | 'dividing by a fraction is the same as multiplying by the reciprocal'
  | 'negative of a negative is positive'
  | 'subtracting is the same as adding the inverse'
  | 'negation is the same as multipling by negative one'
  | 'a positive is the same as multiplying two negatives'
  | 'move negative to first factor'
  | 'move negation inside multiplication'
  | 'move negation out of multiplication'
  | 'adding inverse'
  | 'addition with identity'
  | 'multiplication with identity'
  | 'multiplication by zero'
  | 'commutative property'
  | 'associative property of multiplication'
  | 'associative property of addition'
  | 'multiplying a factor n-times is an exponent'
  | 'a power is the same as multiplying the base n times'
  | 'multiplying powers adds their exponents'
  | 'dividing powers subtracts their exponents'
  | 'One over the power is the same a power with same base but the negative of the same exponent'
  | 'raising a power to another exponent is the same raising the power once an multiplying the exponents'
  | 'A product raised to a exponent is the same as raising each factor to that exponent'
  | 'A product of powers raised to the same exponent are equal to the product of bases raised to that exponent'
  | 'A fraction raised to a exponent is the same a fraction with the numerator and denominator each raised to that exponent'
  | 'A quotient of powers raised to the same exponent are equal to the quotient of bases raised to that exponent'
  | 'anything raised to 0 is equal to 1'
  | 'raising something to the 1st power is a no-op'
  | '1 raised to any power is equal to 1'
  | '0 raised to any power (except for 0) is 0'
  | 'symmetric property'
  | 'decompose sum'
  | 'decompose product'
  | 'distribution'
  | 'factoring'
  | 'evaluation of addition'
  | 'evaluation of multiplication'
  | 'evaluate sum'
  | 'evaluate coefficient'
  | 'A power with a negative exponent is the same as one over the power with the positive exponent'
  | 'adding the same value to both sides'
  | 'removing adding the same value to both sides'
  | 'multiply both sides by the same value'
  | 'remove multiplication from both sides'
  | 'divide both sides by the same value'
  | 'remove division by the same amount';

export type GraderStep = {
  readonly message: GraderStepMessage;
  readonly before: Semantic.types.Node;
  readonly after: Semantic.types.Node;
  readonly substeps: readonly Step[];
};

/**
 * A step reported by the grader: either one of the solver's own steps or a
 * grader-specific one.
 */
export type Step = Solver.Step | GraderStep;

export type Result = {
  readonly steps: readonly Step[];
};

export type Correction = {
  readonly id: number;
  readonly replacement: Semantic.types.Node;
};

// TODO: make this a disjoint union of tagged objects
// instead of having prevNodes and nextNodes, we have
// can have structured nodes and search in both prev/next
// for them depending on the mistake type
export type Mistake = {
  // TODO: rename this to `type` and use string enums instead of integer enums
  readonly id: MistakeId;
  readonly prevNodes: readonly Semantic.types.Node[];
  readonly nextNodes: readonly Semantic.types.Node[];
  readonly corrections: readonly Correction[];
};

export type Context = {
  readonly steps: readonly Step[];
  readonly checker: IStepChecker;

  // Tracks whether we're currently reversed or not, see `runChecks` in
  // step-checker.ts for details.
  readonly reversed: boolean;

  // This array is mutable so that Mistakes can be added to the context object
  // as the prev/next trees are traversed.
  mistakes?: Mistake[]; // eslint-disable-line functional/prefer-readonly-type

  // Used for debugging purposes to see which checks ran successfully as part
  // of the return result.
  readonly successfulChecks: Set<string>; // eslint-disable-line functional/prefer-readonly-type
};

export interface IStepChecker {
  readonly checkStep: Check;
  readonly options: Options;
  readonly __checkStep: (
    prev: Semantic.types.Node,
    next: Semantic.types.Node,
  ) => {
    readonly result?: Result;
    readonly successfulChecks: ReadonlySet<string>;
    readonly mistakes: readonly Mistake[];
  };
}

export type Options = {
  readonly skipEvalChecker?: boolean;
  readonly evalFractions?: boolean;
};

export type Check<
  Prev extends Semantic.types.Node = Semantic.types.Node,
  Next extends Semantic.types.Node = Semantic.types.Node,
> = {
  (prev: Prev, next: Next, context: Context): Result | undefined;

  // Whether or not the check should be run by reversing the prev, next params.
  // Most checks are symmetric.
  symmetric?: boolean; // eslint-disable-line functional/prefer-readonly-type
};
