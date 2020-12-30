import * as Semantic from "@math-blocks/semantic";

const {deepEquals} = Semantic;

export const getCoeff = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    if (node.type === "neg") {
        return Semantic.neg(getCoeff(node.arg));
    }
    const factors = Semantic.getFactors(node);
    return Semantic.isNumber(factors[0]) ? factors[0] : Semantic.number("1");
};

// TODO: curry this
export const isTermOfIdent = (
    term: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
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
    }
    return false;
};

export const flipSign = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    if (node.type === "neg") {
        return node.arg;
    } else {
        return Semantic.neg(node, true);
    }
};

export const convertSubTermToNeg = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
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
