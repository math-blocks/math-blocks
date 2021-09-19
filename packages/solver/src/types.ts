import * as Semantic from "@math-blocks/semantic";

export type Step<T extends Semantic.types.Node = Semantic.types.Node> = {
    readonly message: string;
    readonly before: T;
    readonly after: T;
    readonly substeps: readonly Step<T>[];
};
