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

export const simplifyMul = (
    node: types.Mul, // restrict this to 2 factors
    steps?: Step[],
): types.NumericNode => {
    const [a, b] = node.args;

    // if a and b are monomials
    const aFactors =
        a.type === "neg" ? util.getFactors(a.arg) : util.getFactors(a);
    const bFactors =
        b.type === "neg" ? util.getFactors(b.arg) : util.getFactors(b);

    const resultIsNeg = (a.type === "neg") !== (b.type === "neg");

    let after: types.NumericNode;

    if (util.isNumber(aFactors[0]) && util.isNumber(bFactors[0])) {
        const aCoeff = aFactors[0];
        const bCoeff = bFactors[0];
        // TODO: make the number builder handle fractions or evalNode to everything
        // for us.
        const coeff = builders.number(
            util.evalNode(builders.mul([aCoeff, bCoeff])).toString(),
        );
        const product = builders.mul(
            [coeff, ...aFactors.slice(1), ...bFactors.slice(1)],
            true,
        );
        after = resultIsNeg ? builders.neg(product) : product;
    } else if (util.isNumber(aFactors[0])) {
        const coeff = aFactors[0];
        const product = builders.mul(
            [coeff, ...aFactors.slice(1), ...bFactors],
            true,
        );
        after = resultIsNeg ? builders.neg(product) : product;
    } else if (util.isNumber(bFactors[0])) {
        const coeff = bFactors[0];
        const product = builders.mul(
            [coeff, ...aFactors, ...bFactors.slice(1)],
            true,
        );
        after = resultIsNeg ? builders.neg(product) : product;
    } else {
        const product = builders.mul([...aFactors, ...bFactors], true);
        after = resultIsNeg ? builders.neg(product) : product;
    }

    const factors =
        after.type === "neg"
            ? util.getFactors(after.arg)
            : util.getFactors(after);

    if (util.isNumber(factors[0])) {
        const coeff = factors[0];
        if (util.deepEquals(coeff, builders.number("1"))) {
            const product = builders.mul(factors.slice(1), true);
            after = resultIsNeg ? builders.neg(product) : product;
        }
    }

    // Don't include steps that don't change anything
    if (util.deepEquals(node, after)) {
        return node;
    }

    let message: string;
    if (a.type === "neg" && b.type === "neg") {
        message = "multiplying two negatives is a positive";
    } else if (resultIsNeg) {
        message = "multiplying a negative by a positive is negative";
    } else {
        message = "multiply monomials";
    }

    steps?.push({
        message,
        before: node,
        after,
        substeps: [],
    });

    return after;
};
