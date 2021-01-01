import {builders, types, util} from "@math-blocks/semantic";

import {Transform} from "../types";
import {isNegative} from "../util";

// TODO:
// - powers
// - negative factors
export const reduceFraction: Transform = (node) => {
    if (node.type !== "div") {
        return undefined;
    }

    if (util.deepEquals(node.args[0], builders.number("1"))) {
        return;
    }

    const numFactors =
        node.args[0].type === "neg"
            ? util.getFactors(node.args[0].arg)
            : util.getFactors(node.args[0]);
    const denFactors =
        node.args[1].type === "neg"
            ? util.getFactors(node.args[1].arg)
            : util.getFactors(node.args[1]);

    const resultIsNegative =
        isNegative(node.args[0]) !== isNegative(node.args[1]);

    const commonFactors = util.intersection(numFactors, denFactors);

    const num = builders.mulFactors(
        util.difference(numFactors, commonFactors),
        true,
    );
    const den = builders.mulFactors(
        util.difference(denFactors, commonFactors),
        true,
    );

    let after: types.NumericNode;
    if (util.deepEquals(den, builders.number("1"))) {
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
                after = builders.div(builders.neg(num), den);
            } else {
                after = builders.div(num, builders.neg(den));
            }
        } else {
            after = builders.div(num, den);
        }
    }

    if (resultIsNegative && after.type !== "div") {
        after = builders.neg(after);
    }

    return {
        message: "reduce fraction",
        before: node,
        after,
        substeps: [],
    };
};
