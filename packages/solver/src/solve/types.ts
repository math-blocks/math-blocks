import {types} from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: types.Eq,
    ident: types.Ident,
) => Step | undefined;

export {Step};
