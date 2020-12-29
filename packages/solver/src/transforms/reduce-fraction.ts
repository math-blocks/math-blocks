import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {isNegative} from "../util";

const {deepEquals, intersection, difference} = Semantic;

// TODO:
// - powers
// - negative factors
export const reduceFraction: Transform = (node) => {
    if (node.type !== "div") {
        return undefined;
    }

    if (deepEquals(node.args[0], Semantic.number("1"))) {
        return;
    }

    const numFactors =
        node.args[0].type === "neg"
            ? Semantic.getFactors(node.args[0].arg)
            : Semantic.getFactors(node.args[0]);
    const denFactors =
        node.args[1].type === "neg"
            ? Semantic.getFactors(node.args[1].arg)
            : Semantic.getFactors(node.args[1]);

    const resultIsNegative =
        isNegative(node.args[0]) !== isNegative(node.args[1]);

    const commonFactors = intersection(numFactors, denFactors);

    const num = Semantic.mulFactors(
        difference(numFactors, commonFactors),
        true,
    );
    const den = Semantic.mulFactors(
        difference(denFactors, commonFactors),
        true,
    );

    let after: Semantic.Types.NumericNode;
    if (deepEquals(den, Semantic.number("1"))) {
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
                after = Semantic.div(Semantic.neg(num), den);
            } else {
                after = Semantic.div(num, Semantic.neg(den));
            }
        } else {
            after = Semantic.div(num, den);
        }
    }

    if (resultIsNegative && after.type !== "div") {
        after = Semantic.neg(after);
    }

    return {
        message: "reduce fraction",
        before: node,
        after,
        substeps: [],
    };
};
