import {builders, types, util} from "@math-blocks/semantic";

import {Transform} from "../types";

// This function will evaluate the multiple any factors that are numbers in node
// but won't touch any non-number terms, e.g.
// (2)(x)(3)(y) -> 6xy
// TODO: figure out why using our local version of getFactors breaks things.
export const evalMul: Transform = (node) => {
    if (!util.isNumeric(node)) {
        return;
    }
    const factors = util.getFactors(node);

    const numericFactors = factors.filter(util.isNumber);
    const nonNumericFactors = factors.filter((f) => !util.isNumber(f));

    if (numericFactors.length > 1) {
        const mul = builders.mulFactors(numericFactors);
        const coeff = builders.number(util.evalNode(mul).toString());

        return {
            message: "evaluate multiplication",
            before: node,
            after: builders.mulFactors([coeff, ...nonNumericFactors], true),
            substeps: [],
        };
    }

    return undefined;
};

export const evalAdd: Transform = (node) => {
    if (!util.isNumeric(node)) {
        return;
    }
    const terms = util.getTerms(node);

    const numericTerms = terms.filter(util.isNumber);
    const nonNumericTerms = terms.filter((f) => !util.isNumber(f));

    if (numericTerms.length > 1) {
        const sum = builders.number(
            util.evalNode(builders.addTerms(numericTerms)).toString(),
        );

        return {
            message: "evaluate addition",
            before: node,
            after: builders.mulFactors([...nonNumericTerms, sum], true),
            substeps: [],
        };
    }

    return undefined;
};

// TODO: if the fraction is in lowest terms or otherwise can't be modified, don't
// process it.
export const evalDiv: Transform = (node) => {
    if (node.type !== "div") {
        return;
    }

    if (!util.isNumber(node)) {
        return;
    }

    const [numerator, denominator] = node.args;

    if (util.deepEquals(numerator, builders.number("1"))) {
        return;
    }

    const result = util.evalNode(node);
    let after: types.NumericNode;
    if (result.d === 1) {
        if (result.s === 1) {
            after = builders.number(result.n.toString());
        } else {
            after = builders.neg(builders.number(result.n.toString()));
        }
    } else {
        if (result.s === 1) {
            after = builders.div(
                builders.number(result.n.toString()),
                builders.number(result.d.toString()),
            );
        } else {
            after = builders.neg(
                builders.div(
                    builders.number(result.n.toString()),
                    builders.number(result.d.toString()),
                ),
            );
        }
    }

    // TODO: handle negative fractions
    if (
        util.deepEquals(numerator, builders.number(String(result.n))) &&
        util.deepEquals(denominator, builders.number(String(result.d)))
    ) {
        return;
    }

    return {
        message: "evaluate division",
        before: node,
        after,
        substeps: [],
    };
};
