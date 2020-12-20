import * as Semantic from "@math-blocks/semantic";

// TODO: dedupe with grader
export type Step = {
    message: string;
    nodes: [Semantic.Types.Node, Semantic.Types.Node];
};
