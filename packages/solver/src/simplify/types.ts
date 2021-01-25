import * as Semantic from "@math-blocks/semantic";
import {Step} from "@math-blocks/step-utils";

export type Transform = (
    node: Semantic.types.Node,
    path: Semantic.types.Node[],
) => Step | undefined;
