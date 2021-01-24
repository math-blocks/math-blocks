import * as Semantic from "@math-blocks/semantic";
import {Step} from "@math-blocks/step-utils";

// TODO: backport the change to @math-blocks/semantic
// We want three checks:
// - is it negative
// - is it subtraction
// - is it negative and not subtraction
export const isNegative = (node: Semantic.types.NumericNode): boolean => {
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
    node: Semantic.types.Mul, // restrict this to 2 factors
    steps?: Step[],
): Semantic.types.NumericNode => {
    const [a, b] = node.args;

    // if a and b are monomials
    const aFactors =
        a.type === "neg"
            ? Semantic.util.getFactors(a.arg)
            : Semantic.util.getFactors(a);
    const bFactors =
        b.type === "neg"
            ? Semantic.util.getFactors(b.arg)
            : Semantic.util.getFactors(b);

    const resultIsNeg = (a.type === "neg") !== (b.type === "neg");

    let after: Semantic.types.NumericNode;

    if (
        Semantic.util.isNumber(aFactors[0]) &&
        Semantic.util.isNumber(bFactors[0])
    ) {
        const aCoeff = aFactors[0];
        const bCoeff = bFactors[0];
        // TODO: make the number builder handle fractions or evalNode to everything
        // for us.
        const coeff = Semantic.builders.number(
            Semantic.util
                .evalNode(Semantic.builders.mul([aCoeff, bCoeff]))
                .toString(),
        );
        const product = Semantic.builders.mul(
            [coeff, ...aFactors.slice(1), ...bFactors.slice(1)],
            true,
        );
        after = resultIsNeg ? Semantic.builders.neg(product) : product;
    } else if (Semantic.util.isNumber(aFactors[0])) {
        const coeff = aFactors[0];
        const product = Semantic.builders.mul(
            [coeff, ...aFactors.slice(1), ...bFactors],
            true,
        );
        after = resultIsNeg ? Semantic.builders.neg(product) : product;
    } else if (Semantic.util.isNumber(bFactors[0])) {
        const coeff = bFactors[0];
        const product = Semantic.builders.mul(
            [coeff, ...aFactors, ...bFactors.slice(1)],
            true,
        );
        after = resultIsNeg ? Semantic.builders.neg(product) : product;
    } else {
        const product = Semantic.builders.mul([...aFactors, ...bFactors], true);
        after = resultIsNeg ? Semantic.builders.neg(product) : product;
    }

    const factors =
        after.type === "neg"
            ? Semantic.util.getFactors(after.arg)
            : Semantic.util.getFactors(after);

    if (Semantic.util.isNumber(factors[0])) {
        const coeff = factors[0];
        if (Semantic.util.deepEquals(coeff, Semantic.builders.number("1"))) {
            const product = Semantic.builders.mul(factors.slice(1), true);
            after = resultIsNeg ? Semantic.builders.neg(product) : product;
        }
    }

    // Don't include steps that don't change anything
    if (Semantic.util.deepEquals(node, after)) {
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
