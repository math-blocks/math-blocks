import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

const {deepEquals} = Semantic;

// TODO: handle non-canonicalized terms
export const getCoeff = (node: types.NumericNode): types.NumericNode => {
    if (node.type === "neg") {
        return Semantic.neg(getCoeff(node.arg));
    }
    if (node.type === "div") {
        return Semantic.div(getCoeff(node.args[0]), node.args[1]);
    }
    const factors = Semantic.getFactors(node);
    return Semantic.isNumber(factors[0]) ? factors[0] : Semantic.number("1");
};

// TODO: handle non-canonicalized terms
export const isTermOfIdent = (
    term: types.Node,
    ident: types.Ident,
): boolean => {
    if (deepEquals(ident, term)) {
        return true;
    } else if (term.type === "mul" && term.args.length === 2) {
        const [coeff, varFact] = term.args;
        if (Semantic.isNumber(coeff) && deepEquals(ident, varFact)) {
            return true;
        }
    } else if (term.type === "neg") {
        return isTermOfIdent(term.arg, ident);
    } else if (term.type === "div") {
        const [num, den] = term.args;
        if (Semantic.isNumber(den)) {
            return isTermOfIdent(num, ident);
        }
    }
    return false;
};

export const flipSign = (node: types.NumericNode): types.NumericNode => {
    if (node.type === "neg") {
        return node.arg;
    } else {
        return Semantic.neg(node, true);
    }
};

export const convertSubTermToNeg = (
    node: types.NumericNode,
): types.NumericNode => {
    if (node.type === "neg" && node.subtraction) {
        const factors = Semantic.getFactors(node.arg);
        const numericFactors = factors.filter(Semantic.isNumber);
        const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));
        const orderedFactors = [...numericFactors, ...nonNumericFactors];
        orderedFactors[0] = Semantic.neg(orderedFactors[0]);
        return Semantic.mulFactors(orderedFactors);
    }
    return node;
};
