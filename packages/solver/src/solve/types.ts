import * as Semantic from "@math-blocks/semantic";

export type Transform = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
) => Semantic.Types.Node | undefined;
