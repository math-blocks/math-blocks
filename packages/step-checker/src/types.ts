import * as Semantic from "@math-blocks/semantic";

import {MistakeId, Status} from "./enums";

// TODO: import from editor-parser (or editor)
type Location = {
    path: number[];
    start: number;
    end: number;
};

type Expression = Semantic.Expression<Location | undefined>;

export type Step<Loc> = {
    message: string;
    nodes: Semantic.Expression<Loc>[];
};

export type Result<Loc> = {
    status: Status;
    steps: Step<Loc>[];
};

export const MISTAKE_PRIORITIES: Record<MistakeId, number> = {
    [MistakeId.EQN_ADD_DIFF]: 10,
    [MistakeId.EQN_MUL_DIFF]: 10,
    [MistakeId.EXPR_ADD_NON_IDENTITY]: 5,
    [MistakeId.EXPR_MUL_NON_IDENTITY]: 5,
};

export type Mistake<Loc> = {
    id: MistakeId;
    nodes: Semantic.Expression<Loc>[];
};

export type Context<Loc> = {
    steps: Step<Loc>[];
    checker: IStepChecker<Loc>;

    // Tracks whether we're currently reversed or not, see `runChecks` in
    // step-checker.ts for details.
    reversed: boolean;

    filters?: {
        allowedChecks?: Set<string>;
        disallowedChecks?: Set<string>;
    };

    mistakes: Mistake<Loc>[];

    // Used for debugging purposes to see which checks ran successfully as part
    // of the return result.
    successfulChecks: Set<string>;
};

export interface IStepChecker<Loc> {
    checkStep: Check<Loc>;
    options: Options;
}

export type Options = {
    skipEvalChecker?: boolean;
    evalFractions?: boolean;
};

// Checks should work on expression trees that use Location and TextLocation
// for Loc.
export type Check<Loc> = {
    (
        prev: Semantic.Expression<Loc>,
        next: Semantic.Expression<Loc>,
        context: Context<Loc>,
    ): Result<Loc> | undefined;

    // Whether or not the check should be run by reversing the prev, next params.
    // Most checks are symmetric.
    symmetric?: boolean;

    unfilterable?: boolean;
};

export type HasArgs<Loc> =
    | Semantic.Add<Loc | undefined>
    | Semantic.Mul<Loc | undefined>
    | Semantic.Eq<Loc | undefined>
    | Semantic.Neq<Loc | undefined>
    | Semantic.Lt<Loc | undefined>
    | Semantic.Lte<Loc | undefined>
    | Semantic.Gt<Loc | undefined>
    | Semantic.Gte<Loc | undefined>
    | Semantic.Div<Loc | undefined>;
