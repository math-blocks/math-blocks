import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";

import {getHint} from "./get-hint";

export const showMeHow = (
    ast: Semantic.types.Node,
    identifier: Semantic.types.Identifier,
): Semantic.types.Node => {
    const hint = getHint(ast, identifier);

    return Solver.applyStep(ast, hint);
};
