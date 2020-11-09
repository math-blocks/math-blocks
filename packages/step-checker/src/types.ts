import * as Semantic from "@math-blocks/semantic";

type Expression = Semantic.Expression;

export type Step = {
    message: string;
    nodes: Expression[];
};

export enum Status {
    Correct,
    Incorrect,
}

export type Result = {
    status: Status;
    steps: Step[];
};

export enum MistakeId {
    EQN_ADD_DIFF,
    EQN_MUL_DIFF,
    EXPR_ADD_NON_IDENTITY,
    EXPR_MUL_NON_IDENTITY,
}

export const MISTAKE_PRIORITIES: Record<MistakeId, number> = {
    [MistakeId.EQN_ADD_DIFF]: 10,
    [MistakeId.EQN_MUL_DIFF]: 10,
    [MistakeId.EXPR_ADD_NON_IDENTITY]: 5,
    [MistakeId.EXPR_MUL_NON_IDENTITY]: 5,
};

export type Mistake = {
    id: MistakeId;
    nodes: Expression[];
};

export type Context = {
    steps: Step[];
    checker: IStepChecker;

    // Tracks whether we're currently reversed or not, see `runChecks` in
    // step-checker.ts for details.
    reversed: boolean;

    filters?: {
        allowedChecks?: Set<string>;
        disallowedChecks?: Set<string>;
    };

    mistakes: Mistake[];

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
    Prev extends Expression = Expression,
    Next extends Expression = Expression
> = {
    (prev: Prev, next: Next, context: Context): Result | undefined;

    // Whether or not the check should be run by reversing the prev, next params.
    // Most checks are symmetric.
    symmetric?: boolean;

    unfilterable?: boolean;
};

export type HasArgs =
    | Semantic.Add
    | Semantic.Mul
    | Semantic.Eq
    | Semantic.Neq
    | Semantic.Lt
    | Semantic.Lte
    | Semantic.Gt
    | Semantic.Gte
    | Semantic.Div;
