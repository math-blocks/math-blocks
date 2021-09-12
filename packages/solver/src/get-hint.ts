import * as Semantic from "@math-blocks/semantic";
import type {Step} from "@math-blocks/step-utils";

import {simplify} from "./simplify/simplify";
import {solve} from "./solve/solve";

// NOTE: Some steps will have their own sub-steps which we may want
// to apply to help students better understand what the hint is doing.

export const getHint = (
    ast: Semantic.types.Node,
    identifier: Semantic.types.Identifier,
): Step => {
    if (ast.type === Semantic.NodeType.Equals) {
        const solution = solve(ast, identifier);

        if (solution && solution.substeps.length > 0) {
            // Grab the first step of the solution and apply it to the previous
            // math statement that the user has entered.
            return solution.substeps[0];
        }
    } else {
        const solution = simplify(ast, []);

        if (solution && solution.substeps.length > 0) {
            // Grab the first step of the solution and apply it to the previous
            // math statement that the user has entered.
            return solution.substeps[0];
        }
    }

    throw new Error("Couldn't get a hint");
};
