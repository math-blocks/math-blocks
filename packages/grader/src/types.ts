import * as Semantic from "@math-blocks/semantic";

import {MistakeId} from "./enums";

export type Step = {
    message: string;
    before: Semantic.types.Node;
    after: Semantic.types.Node;
    substeps: [];
};

export type Result = {
    steps: readonly Step[];
};

export const MISTAKE_PRIORITIES: Record<MistakeId, number> = {
    // equation mistakes have the highest priority because they're the most
    // specific.
    [MistakeId.EQN_ADD_DIFF]: 10,
    [MistakeId.EQN_MUL_DIFF]: 10,

    [MistakeId.EXPR_ADD_NON_IDENTITY]: 5,
    [MistakeId.EXPR_MUL_NON_IDENTITY]: 5,

    // eval/decomposition mistakes have the lowest priority since other mistakes
    // are more specific.
    [MistakeId.EVAL_ADD]: 1,
    [MistakeId.EVAL_MUL]: 1,
    [MistakeId.DECOMP_ADD]: 1,
    [MistakeId.DECOMP_MUL]: 1,
};

export type Correction = {
    id: number;
    replacement: Semantic.types.Node;
};

export type Mistake = {
    id: MistakeId;
    prevNodes: readonly Semantic.types.Node[];
    nextNodes: readonly Semantic.types.Node[];
    corrections: readonly Correction[];
};

export type Context = {
    steps: readonly Step[];
    checker: IStepChecker;

    // Tracks whether we're currently reversed or not, see `runChecks` in
    // step-checker.ts for details.
    reversed: boolean;

    // This array is mutable so that Mistakes can be added to the context object
    // as the prev/next trees are traversed.
    mistakes?: Mistake[];

    // Used for debugging purposes to see which checks ran successfully as part
    // of the return result.
    successfulChecks: Set<string>;
};

export interface IStepChecker {
    checkStep: Check;
    options: Options;
}

export type Options = {
    skipEvalChecker?: boolean;
    evalFractions?: boolean;
};

export type Check<
    Prev extends Semantic.types.Node = Semantic.types.Node,
    Next extends Semantic.types.Node = Semantic.types.Node
> = {
    (prev: Prev, next: Next, context: Context): Result | undefined;

    // Whether or not the check should be run by reversing the prev, next params.
    // Most checks are symmetric.
    symmetric?: boolean;
};
