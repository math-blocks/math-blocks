import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

import {Transform} from "../types";
import {isTermOfIdent} from "../util";

export const mulBothSides: Transform = (before, ident) => {
    const [left, right] = before.args as readonly types.NumericNode[];

    if (left.source === "divBothSides" || right.source === "divBothSides") {
        return undefined;
    }

    const leftTerms = Semantic.getTerms(left);

    if (leftTerms.length === 1 && leftTerms[0].type === "div") {
        const [num, den] = leftTerms[0].args;
        if (isTermOfIdent(num, ident) && Semantic.isNumber(den)) {
            const newLeft = Semantic.mul([leftTerms[0], den]);
            const newRight = Semantic.mul([right, den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = Semantic.eq([newLeft, newRight]);

            return {
                message: "multiply both sides",
                before,
                after,
                substeps: [],
            };
        }
    }

    const rightTerms = Semantic.getTerms(right);

    if (rightTerms.length === 1 && rightTerms[0].type === "div") {
        const [num, den] = rightTerms[0].args;
        if (isTermOfIdent(num, ident) && Semantic.isNumber(den)) {
            const newLeft = Semantic.mul([left, den]);
            const newRight = Semantic.mul([rightTerms[0], den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = Semantic.eq([newLeft, newRight]);

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
