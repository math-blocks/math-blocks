import * as Semantic from "@math-blocks/semantic";

export type Step<T extends Semantic.types.Node = Semantic.types.Node> = {
    readonly message: string;
    readonly before: T;
    readonly after: T;
    readonly substeps: readonly Step<T>[];
};

export type Solution<T extends Semantic.types.Node = Semantic.types.Node> = {
    readonly steps: readonly Step<Semantic.types.Node>[];
    readonly answer: T;
};

type SolveEquation = {
    readonly type: "SolveEquation";
    readonly equation: Semantic.types.Eq;
    readonly variable: Semantic.types.Identifier;
};

type SimplifyExpression = {
    readonly type: "SimplifyExpression";
    readonly expression: Semantic.types.NumericNode;
};

export type Problem = SolveEquation | SimplifyExpression;
