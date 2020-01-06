import * as Semantic from "../semantic/semantic";

export type Reason = {
    message: string;
    nodes: Semantic.Expression[];
};

export type Result = {
    equivalent: boolean;
    reasons: Reason[];
};
