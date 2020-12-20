// OUTLINE:
// - solve linear equations
//   - check if each side is linear
//   - simplify each side
//   - move the variable being solved for to one side
//   - move everything else to the other side
//   - divide both sides by the coefficient of the variable being solved for
// - solve linear inequalities
//   - same set of steps, except we flip the direction of the inequality if
//     the coefficient in the last step is negative
// - solve quadratic equations
//   - PRE-REQS: need to add support for plus-minus and comma separate lists
//   - factoring
//   - use the quadratic equation

import * as Semantic from "@math-blocks/semantic";

import {simplify} from "./simplify";
import {deepEquals} from "./util";

const getCoeff = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    const factors = Semantic.getFactors(node);
    return Semantic.isNumber(factors[0]) ? factors[0] : Semantic.number("1");
};

export const solve = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
): Semantic.Types.Node => {
    if (node.type !== "eq") {
        return node;
    }

    let newNode = Semantic.eq(
        node.args.map(simplify) as TwoOrMore<Semantic.Types.Node>,
    );

    const [left, right] = newNode.args as Semantic.Types.NumericNode[];

    const leftTerms = Semantic.getTerms(left);
    const rightTerms = Semantic.getTerms(right);

    const leftIdentTerm = leftTerms.find((term) => {
        // TODO: extract a function that finds all terms with a certain variable
        // type.
        if (deepEquals(ident, term)) {
            return term;
        } else if (term.type === "mul" && term.args.length === 2) {
            const [coeff, varFact] = term.args;
            if (Semantic.isNumber(coeff) && deepEquals(ident, varFact)) {
                return term;
            }
        }
    });

    const rightIdentTerm = rightTerms.find((term) => {
        // TODO: extract a function that finds all terms with a certain variable
        // type.
        if (deepEquals(ident, term)) {
            return term;
        } else if (term.type === "mul" && term.args.length === 2) {
            const [coeff, varFact] = term.args;
            if (Semantic.isNumber(coeff) && deepEquals(ident, varFact)) {
                return term;
            }
        }
    });

    if (leftIdentTerm && leftTerms.length === 1 && !rightIdentTerm) {
        const coeff = getCoeff(leftIdentTerm);

        if (deepEquals(coeff, Semantic.number("1"))) {
            return newNode;
        } else {
            newNode = Semantic.eq(
                newNode.args.map((arg) =>
                    Semantic.div(arg as Semantic.Types.NumericNode, coeff),
                ) as TwoOrMore<Semantic.Types.NumericNode>,
            );

            // After each operation we do to the equation, we should re-run
            // `simplify` on each side.

            newNode = Semantic.eq(
                newNode.args.map(simplify) as TwoOrMore<Semantic.Types.Node>,
            );

            return newNode;
        }
    }

    return newNode;
};
