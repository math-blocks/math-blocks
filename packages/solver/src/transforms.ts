import * as Semantic from "@math-blocks/semantic";

import {Transform} from "./types";

const {deepEquals, evalNode} = Semantic;

export const dropParens: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const terms = Semantic.getTerms(node);
    let changed = false;
    const newTerms = terms.flatMap((term) => {
        if (term.type === "add") {
            changed = true;
            return term.args;
        } else {
            return [term];
        }
    });
    if (!changed) {
        return;
    }
    return {
        message: "drop parentheses",
        before: node,
        after: Semantic.addTerms(newTerms),
        substeps: [],
    };
};

export const addNegToSub: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const terms = Semantic.getTerms(node);
    let changed = false;
    const newTerms = terms.map((term, index) => {
        if (index > 0 && term.type === "neg" && !term.subtraction) {
            changed = true;
            return Semantic.neg(term.arg, true);
        } else {
            return term;
        }
    });
    if (!changed) {
        return undefined;
    }
    return {
        message: "adding the inverse is the same as subtraction",
        before: node,
        after: Semantic.addTerms(newTerms),
        substeps: [],
    };
};

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

export const mulToPower: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const factors = Semantic.getFactors(node);

    if (factors.length < 2) {
        return undefined;
    }

    // map from factor to factor count
    const map = new Map<Semantic.Types.NumericNode, number>();

    for (const factor of factors) {
        let key: Semantic.Types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (deepEquals(k, factor)) {
                key = k;
            }
        }
        if (!key) {
            map.set(factor, 1);
        } else {
            const val = map.get(key) as number;
            map.set(key, val + 1);
        }
    }

    if ([...map.values()].every((exp) => exp === 1)) {
        return undefined;
    }

    const newFactors: Semantic.Types.NumericNode[] = [];
    for (const [key, val] of map.entries()) {
        if (val === 1) {
            newFactors.push(key);
        } else {
            // Clone the key to prevent issues when modifying the AST
            const base = JSON.parse(JSON.stringify(key));
            newFactors.push(Semantic.pow(base, Semantic.number(String(val))));
        }
    }

    // TODO: mimic the implicitness of the incoming node.
    return {
        message: "repeated multiplication can be written as a power",
        before: node,
        after: Semantic.mulFactors(newFactors, true),
        substeps: [],
    };
};
