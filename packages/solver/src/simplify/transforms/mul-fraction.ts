import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

export const mulFraction: Transform = (before) => {
    if (
        before.type === "mul" &&
        before.args.some((arg) => arg.type === "div")
    ) {
        const numFactors: Semantic.Types.NumericNode[] = [];
        const denFactors: Semantic.Types.NumericNode[] = [];

        for (const factor of before.args) {
            if (factor.type === "div") {
                const [num, den] = factor.args;
                numFactors.push(...Semantic.getFactors(num));
                denFactors.push(...Semantic.getFactors(den));
            } else {
                numFactors.push(factor);
            }
        }

        const after = Semantic.div(
            Semantic.mulFactors(numFactors, true),
            Semantic.mulFactors(denFactors, true),
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
