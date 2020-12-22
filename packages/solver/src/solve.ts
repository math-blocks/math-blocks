// OUTLINE:
// - solve linear equations
//   - check if each side is linear
//   - simplify each side
//   - move the variable being solved for to one side
//   - move everything else to the other side
//   - divide both sides by the coefficient of the variable being solved for
// - solve linear inequalities
//   - same set of steps, except we flip the direction of the inequality if
//     the coefficient in the last step is negative
// - solve quadratic equations
//   - PRE-REQS: need to add support for plus-minus and comma separate lists
//   - factoring
//   - use the quadratic equation

import * as Semantic from "@math-blocks/semantic";

import {
    divBothSides,
    moveVariablesToOneSide,
    simplifyBothSides,
    Transform,
} from "./solve-transforms";

export const solve = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
): Semantic.Types.Node => {
    if (node.type !== "eq") {
        return node;
    }

    const transforms: Transform[] = [
        simplifyBothSides,
        moveVariablesToOneSide,
        divBothSides,
    ];

    let current = node as Semantic.Types.Node;
    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next;
        }
    }

    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next;
        }
    }

    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next;
        }
    }

    return current;
};
