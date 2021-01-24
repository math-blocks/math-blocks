import * as Semantic from "@math-blocks/semantic";
import {Step} from "@math-blocks/step-utils";

import {Transform} from "./types";

import {addNegToSub} from "./transforms/add-neg-to-sub";
import {dropParens} from "./transforms/drop-parens";
import {dropAddIdentity} from "./transforms/drop-add-identity";
import {evalMul, evalAdd, evalDiv} from "./transforms/eval";
import {collectLikeTerms} from "./transforms/collect-like-terms";
import {distribute} from "./transforms/distribute";
import {distributeDiv} from "./transforms/distribute-div";
import {reduceFraction} from "./transforms/reduce-fraction";
import {mulFraction} from "./transforms/mul-fraction";
import {mulToPow} from "./transforms/mul-to-pow";
import {simplifyMul} from "./transforms/simplify-mul";

export const simplify: Transform = (node) => {
    const tranforms: Transform[] = [
        dropAddIdentity,

        simplifyMul, // We do this first so that we don't repeat what it does in other transforms

        distribute,
        distributeDiv,
        collectLikeTerms,
        dropParens,

        evalMul, // we want to eval multiplication before mulToPower to avoid (3)(3) -> 3^2
        evalAdd,
        reduceFraction,
        mulFraction,
        evalDiv,
        mulToPow,

        // We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1)
        // before distributing.
        addNegToSub,
    ];

    const substeps: Step[] = [];

    const path: Semantic.types.Node[] = [];
    const enter = (node: Semantic.types.Node): void => {
        path.push(node);
    };

    // The inner loop attempts to apply one or more transforms to nodes in the
    // AST from the inside out.
    const exit = (
        node: Semantic.types.Node,
    ): Semantic.types.Node | undefined => {
        path.pop();
        // TODO: get rid of this check so that we can simplify other types of
        // expressions, e.g. logic expressions.
        if (Semantic.util.isNumeric(node)) {
            let current: Semantic.types.Node = node;
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
        const next = Semantic.util.traverse(current, {enter, exit});
        if (next === current) {
            break;
        }

        // Cloning is important since `Semantic.util.traverse` mutates `current`.
        current = JSON.parse(JSON.stringify(next));
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
