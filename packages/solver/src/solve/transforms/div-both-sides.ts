import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {getCoeff, isTermOfIdent} from "../util";

// TODO: mulBothSides for situations like x/4 = 5 -> x = 20

export const divBothSides: Transform = (before, ident) => {
    if (before.type !== "eq") {
        return;
    }

    const [left, right] = before.args as readonly Semantic.Types.NumericNode[];

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

        if (Semantic.deepEquals(coeff, Semantic.number("1"))) {
            return undefined;
        }

        const after = Semantic.eq(
            (before.args.map((arg) =>
                Semantic.div(arg as Semantic.Types.NumericNode, coeff),
            ) as unknown) as TwoOrMore<Semantic.Types.NumericNode>,
        );

        return {
            message: "divide both sides",
            before,
            after,
            substeps: [],
        };
    }

    if (rightIdentTerms.length === 1 && rightNonIdentTerms.length === 0) {
        const coeff = getCoeff(rightIdentTerms[0]);

        if (Semantic.deepEquals(coeff, Semantic.number("1"))) {
            return undefined;
        }

        const after = Semantic.eq(
            (before.args.map((arg) =>
                Semantic.div(arg as Semantic.Types.NumericNode, coeff),
            ) as unknown) as TwoOrMore<Semantic.Types.NumericNode>,
        );

        return {
            message: "divide both sides by",
            before,
            after,
            substeps: [],
        };
    }

    return undefined;
};
