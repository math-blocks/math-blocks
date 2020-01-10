import * as Semantic from "../semantic/semantic";

export type Step = {
    message: string;
    nodes: Semantic.Expression[];
};

export type Result = {
    equivalent: boolean;
    steps: Step[];
};
