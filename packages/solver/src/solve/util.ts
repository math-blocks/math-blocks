import {builders, types, util} from "@math-blocks/semantic";

// TODO: handle non-canonicalized terms
export const getCoeff = (node: types.NumericNode): types.NumericNode => {
    if (node.type === "neg") {
        return builders.neg(getCoeff(node.arg));
    }
    if (node.type === "div") {
        return builders.div(getCoeff(node.args[0]), node.args[1]);
    }
    const factors = util.getFactors(node);
    return util.isNumber(factors[0]) ? factors[0] : builders.number("1");
};

// TODO: handle non-canonicalized terms
export const isTermOfIdent = (
    term: types.Node,
    ident: types.Ident,
): boolean => {
    if (util.deepEquals(ident, term)) {
        return true;
    } else if (term.type === "mul" && term.args.length === 2) {
        const [coeff, varFact] = term.args;
        if (util.isNumber(coeff) && util.deepEquals(ident, varFact)) {
            return true;
        }
    } else if (term.type === "neg") {
        return isTermOfIdent(term.arg, ident);
    } else if (term.type === "div") {
        const [num, den] = term.args;
        if (util.isNumber(den)) {
            return isTermOfIdent(num, ident);
        }
    }
    return false;
};

export const flipSign = (node: types.NumericNode): types.NumericNode => {
    if (node.type === "neg") {
        return node.arg;
    } else {
        return builders.neg(node, true);
    }
};

export const convertSubTermToNeg = (
    node: types.NumericNode,
): types.NumericNode => {
    if (node.type === "neg" && node.subtraction) {
        const factors = util.getFactors(node.arg);
        const numericFactors = factors.filter(util.isNumber);
        const nonNumericFactors = factors.filter((f) => !util.isNumber(f));
        const orderedFactors = [...numericFactors, ...nonNumericFactors];
        orderedFactors[0] = builders.neg(orderedFactors[0]);
        return builders.mul(orderedFactors, true);
    }
    return node;
};
