import * as Semantic from "@math-blocks/semantic";

export type Step = {
    message: string;
    before: Semantic.Types.Node;
    after: Semantic.Types.Node;
    substeps: Step[];
};
