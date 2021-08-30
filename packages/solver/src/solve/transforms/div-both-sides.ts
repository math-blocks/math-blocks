import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {getCoeff, isTermOfIdent} from "../util";

const {NodeType} = Semantic;

export const divBothSides: Transform = (before, ident) => {
    const [left, right] = before.args as readonly Semantic.types.NumericNode[];

    if (left.source === "mulBothSides" || right.source === "mulBothSides") {
        return undefined;
    }

    const leftTerms = Semantic.util.getTerms(left);
    const rightTerms = Semantic.util.getTerms(right);

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
        if (coeff.type === NodeType.Div) {
            return undefined;
        }

        if (Semantic.util.deepEquals(coeff, Semantic.builders.number("1"))) {
            return undefined;
        }

        // TODO: add a check to make sure this is true
        const args = before.args as TwoOrMore<Semantic.types.NumericNode>;

        const after = Semantic.builders.eq(
            args.map((arg) => {
                const result = Semantic.builders.div(
                    arg as Semantic.types.NumericNode,
                    coeff,
                );
                result.source = "divBothSides";
                return result;
            }) as unknown as TwoOrMore<Semantic.types.NumericNode>,
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
        if (coeff.type === NodeType.Div) {
            return undefined;
        }

        if (Semantic.util.deepEquals(coeff, Semantic.builders.number("1"))) {
            return undefined;
        }

        // TODO: add a check to make sure this is true
        const args = before.args as TwoOrMore<Semantic.types.NumericNode>;

        const after = Semantic.builders.eq(
            args.map((arg) => {
                const result = Semantic.builders.div(
                    arg as Semantic.types.NumericNode,
                    coeff,
                );
                result.source = "divBothSides";
                return result;
            }) as unknown as TwoOrMore<Semantic.types.NumericNode>,
        );

        return {
            message: "divide both sides",
            before,
            after,
            substeps: [],
        };
    }

    return undefined;
};
