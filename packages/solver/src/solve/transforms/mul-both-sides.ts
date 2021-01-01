import {builders, types, util} from "@math-blocks/semantic";

import {Transform} from "../types";
import {isTermOfIdent} from "../util";

export const mulBothSides: Transform = (before, ident) => {
    const [left, right] = before.args as readonly types.NumericNode[];

    if (left.source === "divBothSides" || right.source === "divBothSides") {
        return undefined;
    }

    const leftTerms = util.getTerms(left);

    if (leftTerms.length === 1 && leftTerms[0].type === "div") {
        const [num, den] = leftTerms[0].args;
        if (isTermOfIdent(num, ident) && util.isNumber(den)) {
            const newLeft = builders.mul([leftTerms[0], den]);
            const newRight = builders.mul([right, den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = builders.eq([newLeft, newRight]);

            return {
                message: "multiply both sides",
                before,
                after,
                substeps: [],
            };
        }
    }

    const rightTerms = util.getTerms(right);

    if (rightTerms.length === 1 && rightTerms[0].type === "div") {
        const [num, den] = rightTerms[0].args;
        if (isTermOfIdent(num, ident) && util.isNumber(den)) {
            const newLeft = builders.mul([left, den]);
            const newRight = builders.mul([rightTerms[0], den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = builders.eq([newLeft, newRight]);

            return {
                message: "multiply both sides",
                before,
                after,
                substeps: [],
            };
        }
    }

    return undefined;
};
