import * as Semantic from "@math-blocks/semantic";

import {simplify} from "./simplify";

const {deepEquals} = Semantic;

export type Transform = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
) => Semantic.Types.Node | undefined;

const getCoeff = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    if (node.type === "neg") {
        return Semantic.neg(getCoeff(node.arg));
    }
    const factors = Semantic.getFactors(node);
    return Semantic.isNumber(factors[0]) ? factors[0] : Semantic.number("1");
};

// TODO: mulBothSides for situations like x/4 = 5 -> x = 20

export const divBothSides: Transform = (node, ident) => {
    if (node.type !== "eq") {
        return;
    }

    const [left, right] = node.args as readonly Semantic.Types.NumericNode[];

    const leftTerms = Semantic.getTerms(left);
    const rightTerms = Semantic.getTerms(right);

    const leftIdentTerms = leftTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );
    const rightIdentTerms = rightTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );

    const leftNonIdentTerms = leftTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );
    const rightNonIdentTerms = rightTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );

    if (leftIdentTerms.length === 1 && leftNonIdentTerms.length === 0) {
        const coeff = getCoeff(leftIdentTerms[0]);

        if (deepEquals(coeff, Semantic.number("1"))) {
            return node;
        }

        return Semantic.eq(
            (node.args.map((arg) =>
                Semantic.div(arg as Semantic.Types.NumericNode, coeff),
            ) as unknown) as TwoOrMore<Semantic.Types.NumericNode>,
        );
    }

    if (rightIdentTerms.length === 1 && rightNonIdentTerms.length === 0) {
        const coeff = getCoeff(rightIdentTerms[0]);

        if (deepEquals(coeff, Semantic.number("1"))) {
            return node;
        }

        return Semantic.eq(
            (node.args.map((arg) =>
                Semantic.div(arg as Semantic.Types.NumericNode, coeff),
            ) as unknown) as TwoOrMore<Semantic.Types.NumericNode>,
        );
    }

    return undefined;
};

// TODO: curry this
const isTermOfIdent = (
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

const flipSign = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    if (node.type === "neg") {
        return node.arg;
    } else {
        return Semantic.neg(node, true);
    }
};

const convertSubTermToNeg = (
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

export const moveVariablesToOneSide: Transform = (node, ident) => {
    if (node.type !== "eq") {
        return;
    }

    const [left, right] = node.args as readonly Semantic.Types.NumericNode[];

    const leftTerms = Semantic.getTerms(left);
    const rightTerms = Semantic.getTerms(right);

    const leftIdentTerms = leftTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );
    const rightIdentTerms = rightTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );

    const leftNonIdentTerms = leftTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );
    const rightNonIdentTerms = rightTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );

    if (leftIdentTerms.length > 1 || rightIdentTerms.length > 1) {
        // One (or both) of the sides hasn't been simplified
        return;
    }

    if (leftIdentTerms.length === 1 && rightIdentTerms.length === 1) {
        // There's a term with the identifier we're trying to solve for on both sides

        // Move identifiers to the left
        const left =
            leftIdentTerms[0].type === "neg"
                ? Semantic.addTerms([
                      convertSubTermToNeg(leftIdentTerms[0]),
                      ...leftIdentTerms.slice(1),
                      ...rightIdentTerms.map(flipSign),
                  ])
                : Semantic.addTerms([
                      ...leftIdentTerms,
                      ...rightIdentTerms.map(flipSign),
                  ]);

        // Move non-identifiers to the right
        const right = Semantic.addTerms([
            ...rightNonIdentTerms,
            ...leftNonIdentTerms.map(flipSign),
        ]);

        return Semantic.eq([left, right]);
    }

    if (leftIdentTerms.length === 1 && rightIdentTerms.length === 0) {
        let left = leftIdentTerms[0];
        if (left.type === "neg") {
            left = convertSubTermToNeg(left);
        }

        // Move non-identifiers to the right.
        const right = Semantic.addTerms([
            ...rightNonIdentTerms,
            ...leftNonIdentTerms.map(flipSign),
        ]);

        return Semantic.eq([left, right]);
    }

    if (leftIdentTerms.length === 0 && rightIdentTerms.length === 1) {
        // Move non-identifiers to the left.
        const left = Semantic.addTerms([
            ...leftNonIdentTerms,
            ...rightNonIdentTerms.map(flipSign),
        ]);

        let right = rightIdentTerms[0];
        if (right.type === "neg") {
            right = convertSubTermToNeg(right);
        }

        return Semantic.eq([left, right]);
    }

    return undefined;
};

export const simplifyBothSides: Transform = (node, ident) => {
    if (node.type !== "eq") {
        return undefined;
    }

    const left = simplify(node.args[0], []);
    if (node.args[1] === undefined) {
        console.log(node);
    }
    const right = simplify(node.args[1], []);

    if (left && right) {
        return Semantic.eq([left.after, right.after]);
    }
    if (left) {
        return Semantic.eq([left.after, node.args[1]]);
    }
    if (right) {
        return Semantic.eq([node.args[0], right.after]);
    }

    return undefined;
};
