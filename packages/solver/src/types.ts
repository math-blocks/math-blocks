import * as Semantic from "@math-blocks/semantic";

export type Step = {
    readonly message: string;
    readonly before: Semantic.types.Node;
    readonly after: Semantic.types.Node;
    readonly substeps: readonly Step[];
};
