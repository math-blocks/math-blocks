import * as Semantic from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: Semantic.Types.Node,
    path: Semantic.Types.Node[],
) => Step | undefined;

export {Step};
