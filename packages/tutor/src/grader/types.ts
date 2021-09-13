import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";

import {MistakeId} from "./enums";

export type Result = {
    readonly steps: readonly Solver.Step[];
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
    readonly steps: readonly Solver.Step[];
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
