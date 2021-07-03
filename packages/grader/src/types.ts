import * as Semantic from "@math-blocks/semantic";
import {Step} from "@math-blocks/step-utils";

import {MistakeId} from "./enums";

export type Result = {
    readonly steps: readonly Step[];
};

export type Correction = {
    readonly id: number;
    readonly replacement: Semantic.types.Node;
};

export type Mistake = {
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
