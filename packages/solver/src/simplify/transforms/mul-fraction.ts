import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

export const mulFraction: Transform = (before) => {
    if (
        before.type === "mul" &&
        before.args.some((arg) => arg.type === "div")
    ) {
        const numFactors: Semantic.types.NumericNode[] = [];
        const denFactors: Semantic.types.NumericNode[] = [];

        for (const factor of before.args) {
            if (factor.type === "div") {
                const [num, den] = factor.args;
                numFactors.push(...Semantic.util.getFactors(num));
                denFactors.push(...Semantic.util.getFactors(den));
            } else {
                numFactors.push(factor);
            }
        }

        const after = Semantic.builders.div(
            Semantic.builders.mul(numFactors, true),
            Semantic.builders.mul(denFactors, true),
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
