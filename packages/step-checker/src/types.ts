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
    Prev extends Semantic.Expression = Semantic.Expression,
    Next extends Semantic.Expression = Semantic.Expression
> = {
    (
        prev: Prev,
        next: Next,
        context: Context,
        reverse?: boolean,
    ): Result | void;
    symmetric?: boolean;
    parallel?: boolean;
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
