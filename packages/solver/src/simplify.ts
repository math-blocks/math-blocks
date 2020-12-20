import * as Semantic from "@math-blocks/semantic";

import {
    collectLikeTerms,
    dropParens,
    distribute,
    addNegToSub,
} from "./transforms";

// There are two things going on:
// - outer loop: simplify each side of the equation until we reach a steady state
//   - how do we determine if a change has occurred?
// - inner loop: traverse the AST and simplify sub-expressions

type Transform = (
    node: Semantic.Types.NumericNode,
) => Semantic.Types.NumericNode | undefined;

// TODO: instead of just returning the new node, we should provide an array of
// steps that describe how the solution was arrived at
export const simplify = (node: Semantic.Types.Node): Semantic.Types.Node => {
    const tranforms: Transform[] = [
        distribute,
        collectLikeTerms,
        dropParens,

        // We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1)
        // before distributing.
        addNegToSub,
    ];

    if (Semantic.isNumeric(node)) {
        let current: Semantic.Types.NumericNode = node;

        let count = 0;

        while (count < 10) {
            let next: Semantic.Types.NumericNode | undefined;
            for (const transform of tranforms) {
                next = transform(current);
                if (next) {
                    break;
                }
            }
            if (next) {
                current = next;
                count++;
            } else {
                return current;
            }
        }
    }

    // If we don't know how to simplify it we return the original node
    return node;
};
