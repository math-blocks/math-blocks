import * as Semantic from "@math-blocks/semantic";

import {
    collectLikeTerms,
    dropParens,
    addNegToSub,
    evalMul,
    evalAdd,
    evalDiv,
    simplifyFraction,
    mulToPower,
} from "./transforms";
import {distribute} from "./transforms/distribute";
import {Step, Transform} from "./types";

// TODO: collect all of the steps and sub-steps
export const simplify: Transform = (node) => {
    const tranforms: Transform[] = [
        distribute,
        collectLikeTerms,
        dropParens,

        evalMul, // we want to eval multiplication before mulToPower to avoid (3)(3) -> 3^2
        evalAdd,
        simplifyFraction,
        evalDiv,
        mulToPower,

        // We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1)
        // before distributing.
        addNegToSub,
    ];

    const substeps: Step[] = [];

    const path: Semantic.Types.Node[] = [];
    const enter = (node: Semantic.Types.Node): void => {
        path.push(node);
    };

    // The inner loop attempts to apply one or more transforms to nodes in the
    // AST from the inside out.
    const exit = (
        node: Semantic.Types.Node,
    ): Semantic.Types.Node | undefined => {
        path.pop();
        // TODO: get rid of this check so that we can simplify other types of
        // expressions, e.g. logic expressions.
        if (Semantic.isNumeric(node)) {
            let current: Semantic.Types.Node = node;
            for (let i = 0; i < 10; i++) {
                let step: Step | undefined;
                for (const transform of tranforms) {
                    step = transform(current, path);
                    // Multiple transforms can be applied to the current node.
                    if (step) {
                        break;
                    }
                }

                // None of the transforms suceeded
                if (!step) {
                    return current;
                }

                // Update the current node so that we can attemp to transform
                // it again.
                current = step.after;
                substeps.push(step);
            }
        }
    };

    // The outer loop traverses the tree multiple times until the inner loop
    // is no longer making any changes to the AST.
    let current = node;
    for (let i = 0; i < 10; i++) {
        current = Semantic.traverse(current, {enter, exit});
    }

    if (substeps.length > 0) {
        return {
            message: "simplify expression",
            before: node,
            after: current,
            substeps,
        };
    }

    return undefined;
};
