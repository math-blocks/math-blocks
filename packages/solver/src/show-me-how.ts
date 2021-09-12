import * as Semantic from "@math-blocks/semantic";
import {applyStep} from "@math-blocks/step-utils";

import {getHint} from "./get-hint";

export const showMeHow = (
    ast: Semantic.types.Node,
    identifier: Semantic.types.Identifier,
): Semantic.types.Node => {
    const hint = getHint(ast, identifier);

    return applyStep(ast, hint);
};
