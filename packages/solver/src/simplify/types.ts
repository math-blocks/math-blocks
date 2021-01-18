import * as Semantic from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: Semantic.types.Node,
    path: Semantic.types.Node[],
) => Step | undefined;

export {Step};
