import * as Semantic from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
) => Step | undefined;

export {Step};
