import * as Semantic from "@math-blocks/semantic";

import {
    collectLikeTerms,
    dropParens,
    distribute,
    addNegToSub,
    evalMul,
} from "./transforms";

type Transform = (
    node: Semantic.Types.NumericNode,
) => Semantic.Types.NumericNode | undefined;

// TODO: collect all of the steps and sub-steps
export const simplify = (node: Semantic.Types.Node): Semantic.Types.Node => {
    const tranforms: Transform[] = [
        distribute,
        collectLikeTerms,
        dropParens,

        evalMul,

        // We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1)
        // before distributing.
        addNegToSub,
    ];

    let changed;

    // The inner loop attempts to apply one or more transforms to nodes in the
    // AST from the inside out.
    const exit = (
        node: Semantic.Types.Node,
    ): Semantic.Types.Node | undefined => {
        // TODO: get rid of this check so that we can simplify other types of
        // expressions, e.g. logic expressions.
        if (Semantic.isNumeric(node)) {
            let current = node;
            for (let i = 0; i < 10; i++) {
                let next: Semantic.Types.NumericNode | undefined;
                for (const transform of tranforms) {
                    next = transform(current);
                    // Multiple transforms can be applied to the current node.
                    if (next) {
                        changed = true;
                        break;
                    }
                }

                // None of the transforms suceeded
                if (!next) {
                    return current;
                }

                // Update the current node so that we can attemp to transform
                // it again.
                current = next;
            }
        }
    };

    // The outer loop traverses the tree multiple times until the inner loop
    // is no longer making any changes to the AST.
    let current = node;
    for (let i = 0; i < 10; i++) {
        changed = false;
        current = Semantic.traverse(current, {exit});
        if (!changed) {
            return current;
        }
    }

    return current;
};
