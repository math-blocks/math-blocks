import {builders, types, util} from "@math-blocks/semantic";

import {Transform} from "../types";

export const mulFraction: Transform = (before) => {
    if (
        before.type === "mul" &&
        before.args.some((arg) => arg.type === "div")
    ) {
        const numFactors: types.NumericNode[] = [];
        const denFactors: types.NumericNode[] = [];

        for (const factor of before.args) {
            if (factor.type === "div") {
                const [num, den] = factor.args;
                numFactors.push(...util.getFactors(num));
                denFactors.push(...util.getFactors(den));
            } else {
                numFactors.push(factor);
            }
        }

        const after = builders.div(
            builders.mul(numFactors, true),
            builders.mul(denFactors, true),
        );

        return {
            // TODO: customize the message depending on whether there are one
            // or more factors that are fractions.
            message: "multiply fraction(s)",
            before,
            after,
            substeps: [],
        };
    }

    return undefined;
};
