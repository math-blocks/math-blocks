import * as Semantic from "@math-blocks/semantic";

import {MistakeId, Status} from "./enums";

export type Step = {
    message: string;
    nodes: [Semantic.Types.Node, Semantic.Types.Node];
};

export type Result = {
    status: Status;
    steps: Step[];
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
    replacement: Semantic.Types.Node;
};

export type Mistake = {
    id: MistakeId;
    prevNodes: Semantic.Types.Node[];
    nextNodes: Semantic.Types.Node[];
    corrections: Correction[];
};

export type Context = {
    steps: Step[];
    checker: IStepChecker;

    // Tracks whether we're currently reversed or not, see `runChecks` in
    // step-checker.ts for details.
    reversed: boolean;

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
    Prev extends Semantic.Types.Node = Semantic.Types.Node,
    Next extends Semantic.Types.Node = Semantic.Types.Node
> = {
    (prev: Prev, next: Next, context: Context): Result | undefined;

    // Whether or not the check should be run by reversing the prev, next params.
    // Most checks are symmetric.
    symmetric?: boolean;
};
