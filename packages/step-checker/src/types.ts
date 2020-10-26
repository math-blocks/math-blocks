import * as Semantic from "@math-blocks/semantic";

export type Step = {
    message: string;
    nodes: Semantic.Expression[];
};

export type Result = {
    steps: Step[];
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

export enum ParallelStrategy {
    ShortestPathWins = "SHORTEST",
    ForwardWins = "FORWARD",
}

export type Check<
    Prev extends Semantic.Expression = Semantic.Expression,
    Next extends Semantic.Expression = Semantic.Expression
> = {
    (prev: Prev, next: Next, context: Context): Result | void;

    // Whether or not the check should be run by reversing the prev, next params.
    // Most checks are symmetric.
    symmetric?: boolean;

    // Parallel implies symmetric.  We run check both forwards and reversed
    // paths and if both win then we pick the winner based on the strategy.
    parallel?: ParallelStrategy;

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
