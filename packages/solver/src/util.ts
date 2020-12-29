import * as Semantic from "@math-blocks/semantic";
import {
    deepEquals,
    evalNode,
    number,
    isNumber,
    getFactors,
    mulFactors,
} from "@math-blocks/semantic";

import {Step} from "./types";

// TODO: backport the change to @math-blocks/semantic
// We want three checks:
// - is it negative
// - is it subtraction
// - is it negative and not subtraction
export const isNegative = (node: Semantic.Types.NumericNode): boolean => {
    if (node.type === "neg") {
        return !isNegative(node.arg);
    }
    if (node.type === "mul") {
        let count = 0;
        for (const factor of node.args) {
            if (isNegative(factor)) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    return false;
};

export const mul = (
    a: Semantic.Types.NumericNode,
    b: Semantic.Types.NumericNode,
    substeps?: Step[], // NOTE: this array is modified
): Semantic.Types.NumericNode => {
    const aFactors: readonly Semantic.Types.NumericNode[] =
        a.type === "neg" ? getFactors(a.arg) : getFactors(a);
    const bFactors: readonly Semantic.Types.NumericNode[] =
        b.type === "neg" ? getFactors(b.arg) : getFactors(b);

    // It's okay to reuse this since we're only using it for comparison
    const one: Semantic.Types.Num = {
        id: -1,
        type: "number",
        value: "1",
    };

    const isResultNegative = isNegative(a) !== isNegative(b);

    const numberFactors = [
        ...aFactors.filter(isNumber),
        ...bFactors.filter(isNumber),
    ];

    const nonNumberFactors = [
        ...aFactors.filter((f) => !isNumber(f)),
        ...bFactors.filter((f) => !isNumber(f)),
    ];

    let coeff: Semantic.Types.NumericNode[];
    if (numberFactors.length === 0) {
        coeff = []; // avoid introducing a coefficient if we don't need to
    } else if (numberFactors.length === 1) {
        coeff = numberFactors;
    } else {
        // Multiply all number factors together to determine the new coefficient
        const before = Semantic.mulFactors(numberFactors, true);
        const after = number(evalNode(before).toString());
        substeps?.push({
            message: "evaluate multiplication",
            before,
            after,
            substeps: [],
        });
        coeff = [after];
    }

    let after: Semantic.Types.NumericNode;

    if (isResultNegative) {
        const before = Semantic.neg(
            mulFactors([...coeff, ...nonNumberFactors], true),
        );
        if (deepEquals(coeff[0], one) && nonNumberFactors.length > 0) {
            after = Semantic.neg(mulFactors(nonNumberFactors, true));
            substeps?.push({
                message: "multiplication by -1 is the same as being negative",
                before,
                after,
                substeps: [],
            });
        } else {
            after = before;
        }
    } else {
        const before = mulFactors([...coeff, ...nonNumberFactors], true);
        if (deepEquals(coeff[0], one) && nonNumberFactors.length > 0) {
            after = mulFactors(nonNumberFactors, true);
            substeps?.push({
                message: "multiplication by 1 is a no-op",
                before,
                after,
                substeps: [],
            });
        } else {
            after = before;
        }
    }

    if (isNegative(a) && isNegative(b)) {
        const before = Semantic.mulFactors(numberFactors, true);
        substeps?.push({
            message: "multiplying two negatives is a positive",
            before,
            after,
            substeps: [],
        });
    }

    return after;
};
