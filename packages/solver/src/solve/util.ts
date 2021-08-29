import * as Semantic from "@math-blocks/semantic";

// TODO: handle non-canonicalized terms
export const getCoeff = (
    node: Semantic.types.NumericNode,
): Semantic.types.NumericNode => {
    if (node.type === "neg") {
        return Semantic.builders.neg(getCoeff(node.arg));
    }
    if (node.type === "div") {
        return Semantic.builders.div(getCoeff(node.args[0]), node.args[1]);
    }
    const factors = Semantic.util.getFactors(node);
    return Semantic.util.isNumber(factors[0])
        ? factors[0]
        : Semantic.builders.number("1");
};

// TODO: handle non-canonicalized terms
export const isTermOfIdent = (
    term: Semantic.types.Node,
    ident: Semantic.types.Identifier,
): boolean => {
    if (Semantic.util.deepEquals(ident, term)) {
        return true;
    } else if (term.type === "mul" && term.args.length === 2) {
        const [coeff, varFact] = term.args;
        if (
            Semantic.util.isNumber(coeff) &&
            Semantic.util.deepEquals(ident, varFact)
        ) {
            return true;
        }
    } else if (term.type === "neg") {
        return isTermOfIdent(term.arg, ident);
    } else if (term.type === "div") {
        const [num, den] = term.args;
        if (Semantic.util.isNumber(den)) {
            return isTermOfIdent(num, ident);
        }
    }
    return false;
};

export const flipSign = (
    node: Semantic.types.NumericNode,
): Semantic.types.NumericNode => {
    if (node.type === "neg") {
        return node.arg;
    } else {
        return Semantic.builders.neg(node, true);
    }
};

export const convertSubTermToNeg = (
    node: Semantic.types.NumericNode,
): Semantic.types.NumericNode => {
    if (node.type === "neg" && node.subtraction) {
        const factors = Semantic.util.getFactors(node.arg);
        const numericFactors = factors.filter(Semantic.util.isNumber);
        const nonNumericFactors = factors.filter(
            (f) => !Semantic.util.isNumber(f),
        );
        const orderedFactors = [...numericFactors, ...nonNumericFactors];
        orderedFactors[0] = Semantic.builders.neg(orderedFactors[0]);
        return Semantic.builders.mul(orderedFactors, true);
    }
    return node;
};
