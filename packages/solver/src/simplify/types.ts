import {types} from "@math-blocks/semantic";

import {Step} from "../types";

export type Transform = (
    node: types.Node,
    path: types.Node[],
) => Step | undefined;

export {Step};
