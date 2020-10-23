import * as Semantic from "@math-blocks/semantic";

export type Step = {
    message: string;
    nodes: Semantic.Expression[];
};

export type Result = {
    equivalent: boolean;
    steps: Step[];
};

export type Context = {
    steps: Step[];
    checker: IStepChecker;
};

export interface IStepChecker {
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        // We pass an array of reasons since cycles may include multiple steps
        context: Context,
    ): Result;
    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result;
    checkArgs<T extends HasArgs>(prev: T, next: T, context: Context): Result;
    intersection(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): Semantic.Expression[];
    difference(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): Semantic.Expression[];
    // TODO: change this to return a Result
    equality(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): boolean;
    options: Options;
}

export type Options = {
    skipEvalChecker?: boolean;
    evalFractions?: boolean;
};

export type Check<
    Prev extends Semantic.Expression = Semantic.Expression,
    Next extends Semantic.Expression = Semantic.Expression
> = (prev: Prev, next: Next, context: Context, reverse?: boolean) => Result;

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
