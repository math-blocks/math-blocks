import * as Semantic from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: Semantic.types.Eq,
    ident: Semantic.types.Ident,
) => Step | undefined;

export {Step};