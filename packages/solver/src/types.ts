import * as Semantic from "@math-blocks/semantic";

export type Step = {
    message: string;
    before: Semantic.types.Node;
    after: Semantic.types.Node;
    substeps: Step[];
};
