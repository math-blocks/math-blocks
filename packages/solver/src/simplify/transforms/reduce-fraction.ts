import * as Semantic from "@math-blocks/semantic";

import {isNegative} from "../util";

import type {Transform} from "../types";

const {NodeType} = Semantic;

// TODO:
// - powers
// - negative factors
export const reduceFraction: Transform = (node) => {
    if (node.type !== NodeType.Div) {
        return undefined;
    }

    if (Semantic.util.deepEquals(node.args[0], Semantic.builders.number("1"))) {
        return;
    }

    const numFactors =
        node.args[0].type === NodeType.Neg
            ? Semantic.util.getFactors(node.args[0].arg)
            : Semantic.util.getFactors(node.args[0]);
    const denFactors =
        node.args[1].type === NodeType.Neg
            ? Semantic.util.getFactors(node.args[1].arg)
            : Semantic.util.getFactors(node.args[1]);

    const resultIsNegative =
        isNegative(node.args[0]) !== isNegative(node.args[1]);

    const commonFactors = Semantic.util.intersection(numFactors, denFactors);

    const num = Semantic.builders.mul(
        Semantic.util.difference(numFactors, commonFactors),
        true,
    );
    const den = Semantic.builders.mul(
        Semantic.util.difference(denFactors, commonFactors),
        true,
    );

    let after: Semantic.types.NumericNode;
    if (Semantic.util.deepEquals(den, Semantic.builders.number("1"))) {
        // a / 1 -> a
        after = num;
    } else {
        // If there were no common factors then we weren't able to reduce anything.
        if (commonFactors.length === 0) {
            return;
        }
        // a / b
        if (resultIsNegative) {
            // Maintain the position of the negative.
            if (isNegative(node.args[0])) {
                after = Semantic.builders.div(Semantic.builders.neg(num), den);
            } else {
                after = Semantic.builders.div(num, Semantic.builders.neg(den));
            }
        } else {
            after = Semantic.builders.div(num, den);
        }
    }

    if (resultIsNegative && after.type !== NodeType.Div) {
        after = Semantic.builders.neg(after);
    }

    return {
        message: "reduce fraction",
        before: node,
        after,
        substeps: [],
    };
};
