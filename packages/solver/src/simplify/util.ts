import {builders, types, util} from "@math-blocks/semantic";

import {Step} from "./types";

// TODO: backport the change to @math-blocks/semantic
// We want three checks:
// - is it negative
// - is it subtraction
// - is it negative and not subtraction
export const isNegative = (node: types.NumericNode): boolean => {
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
    a: types.NumericNode,
    b: types.NumericNode,
    substeps?: Step[], // NOTE: this array is modified
): types.NumericNode => {
    const aFactors: readonly types.NumericNode[] =
        a.type === "neg" ? util.getFactors(a.arg) : util.getFactors(a);
    const bFactors: readonly types.NumericNode[] =
        b.type === "neg" ? util.getFactors(b.arg) : util.getFactors(b);

    // It's okay to reuse this since we're only using it for comparison
    const one: types.Num = {
        id: -1,
        type: "number",
        value: "1",
    };

    const isResultNegative = isNegative(a) !== isNegative(b);

    const numberFactors = [
        ...aFactors.filter(util.isNumber),
        ...bFactors.filter(util.isNumber),
    ];

    const nonNumberFactors = [
        ...aFactors.filter((f) => !util.isNumber(f)),
        ...bFactors.filter((f) => !util.isNumber(f)),
    ];

    let coeff: types.NumericNode[];
    if (numberFactors.length === 0) {
        coeff = []; // avoid introducing a coefficient if we don't need to
    } else if (numberFactors.length === 1) {
        coeff = numberFactors;
    } else {
        // Multiply all number factors together to determine the new coefficient
        const before = builders.mulFactors(numberFactors, true);
        const after = builders.number(util.evalNode(before).toString());
        substeps?.push({
            message: "evaluate multiplication",
            before,
            after,
            substeps: [],
        });
        coeff = [after];
    }

    let after: types.NumericNode;

    if (isResultNegative) {
        const before = builders.neg(
            builders.mulFactors([...coeff, ...nonNumberFactors], true),
        );
        if (util.deepEquals(coeff[0], one) && nonNumberFactors.length > 0) {
            after = builders.neg(builders.mulFactors(nonNumberFactors, true));
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
        const before = builders.mulFactors(
            [...coeff, ...nonNumberFactors],
            true,
        );
        if (util.deepEquals(coeff[0], one) && nonNumberFactors.length > 0) {
            after = builders.mulFactors(nonNumberFactors, true);
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
        const before = builders.mulFactors(numberFactors, true);
        substeps?.push({
            message: "multiplying two negatives is a positive",
            before,
            after,
            substeps: [],
        });
    }

    return after;
};
