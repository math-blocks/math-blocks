import * as Semantic from "@math-blocks/semantic";

import {isTermOfIdent} from "../util";

import type {Transform} from "../types";

const {NodeType} = Semantic;

export const mulBothSides: Transform = (before, ident) => {
    const [left, right] = before.args as readonly Semantic.types.NumericNode[];

    if (left.source === "divBothSides" || right.source === "divBothSides") {
        return undefined;
    }

    const leftTerms = Semantic.util.getTerms(left);

    if (leftTerms.length === 1 && leftTerms[0].type === NodeType.Div) {
        const [num, den] = leftTerms[0].args;
        if (isTermOfIdent(num, ident) && Semantic.util.isNumber(den)) {
            const newLeft = Semantic.builders.mul([leftTerms[0], den]);
            const newRight = Semantic.builders.mul([right, den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = Semantic.builders.eq([newLeft, newRight]);

            return {
                message: "multiply both sides",
                before,
                after,
                substeps: [],
            };
        }
    }

    const rightTerms = Semantic.util.getTerms(right);

    if (rightTerms.length === 1 && rightTerms[0].type === NodeType.Div) {
        const [num, den] = rightTerms[0].args;
        if (isTermOfIdent(num, ident) && Semantic.util.isNumber(den)) {
            const newLeft = Semantic.builders.mul([left, den]);
            const newRight = Semantic.builders.mul([rightTerms[0], den]);

            newLeft.source = "mulBothSides";
            newRight.source = "mulBothSides";

            const after = Semantic.builders.eq([newLeft, newRight]);

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
