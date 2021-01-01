import * as Semantic from "@math-blocks/semantic";

import {divBothSides} from "./transforms/div-both-sides";
import {mulBothSides} from "./transforms/mul-both-sides";
import {moveTermsToOneSide} from "./transforms/move-terms-to-one-side";
import {simplifyBothSides} from "./transforms/simplify-both-sides";
import {Step, Transform} from "./types";

/**
 * Solve an equation for a given variable.
 *
 * Handles the following types of equations:
 * - linear
 *
 * TODO:
 * - linear inequality
 * - quadratic
 *
 * @param node the equation (or system of equations) being solved
 * @param ident the variable being solved for
 */
export const solve: Transform = (node, ident) => {
    if (node.type !== "eq") {
        return undefined;
    }

    const transforms: Transform[] = [
        simplifyBothSides,
        moveTermsToOneSide,
        divBothSides,
        mulBothSides,
    ];

    const substeps: Step[] = [];
    let current = node as Semantic.Types.Eq;
    for (let i = 0; i < 10; i++) {
        let changed = false;
        for (const transform of transforms) {
            const next = transform(current, ident);
            if (next) {
                changed = true;
                current = next.after as Semantic.Types.Eq;
                substeps.push(next);
            }
        }
        if (!changed) {
            break;
        }
    }

    if (substeps.length > 0) {
        return {
            message: "solve for variable", // TODO: include variable in message
            before: node,
            after: current,
            substeps,
        };
    }

    return undefined;
};
