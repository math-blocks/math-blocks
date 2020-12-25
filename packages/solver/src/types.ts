import * as Semantic from "@math-blocks/semantic";

// TODO: dedupe with grader
export type Step = {
    message: string;
    before: Semantic.Types.Node;
    after: Semantic.Types.Node;
    substeps: Step[];
};

export type Transform = (
    node: Semantic.Types.Node,
    path: Semantic.Types.Node[],
) => Step | undefined;
