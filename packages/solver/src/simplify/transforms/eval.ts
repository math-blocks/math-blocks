import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

const {deepEquals, evalNode} = Semantic;

// This function will evaluate the multiple any factors that are numbers in node
// but won't touch any non-number terms, e.g.
// (2)(x)(3)(y) -> 6xy
// TODO: figure out why using our local version of getFactors breaks things.
export const evalMul: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const factors = Semantic.getFactors(node);

    const numericFactors = factors.filter(Semantic.isNumber);
    const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

    if (numericFactors.length > 1) {
        const mul = Semantic.mulFactors(numericFactors);
        const coeff = Semantic.number(evalNode(mul).toString());

        return {
            message: "evaluate multiplication",
            before: node,
            after: Semantic.mulFactors([coeff, ...nonNumericFactors], true),
            substeps: [],
        };
    }

    return undefined;
};

export const evalAdd: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const terms = Semantic.getTerms(node);

    const numericTerms = terms.filter(Semantic.isNumber);
    const nonNumericTerms = terms.filter((f) => !Semantic.isNumber(f));

    if (numericTerms.length > 1) {
        const sum = Semantic.number(
            evalNode(Semantic.addTerms(numericTerms)).toString(),
        );

        return {
            message: "evaluate addition",
            before: node,
            after: Semantic.mulFactors([...nonNumericTerms, sum], true),
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

    if (!Semantic.isNumber(node)) {
        return;
    }

    const [numerator, denominator] = node.args;

    if (deepEquals(numerator, Semantic.number("1"))) {
        return;
    }

    const result = evalNode(node);
    let after: Semantic.Types.NumericNode;
    if (result.d === 1) {
        if (result.s === 1) {
            after = Semantic.number(result.n.toString());
        } else {
            after = Semantic.neg(Semantic.number(result.n.toString()));
        }
    } else {
        if (result.s === 1) {
            after = Semantic.div(
                Semantic.number(result.n.toString()),
                Semantic.number(result.d.toString()),
            );
        } else {
            after = Semantic.neg(
                Semantic.div(
                    Semantic.number(result.n.toString()),
                    Semantic.number(result.d.toString()),
                ),
            );
        }
    }

    // TODO: handle negative fractions
    if (
        deepEquals(numerator, Semantic.number(String(result.n))) &&
        deepEquals(denominator, Semantic.number(String(result.d)))
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
