import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {isTermOfIdent, flipSign, convertSubTermToNeg} from "../util";

/**
 * Moves all terms matching `ident` to one side and those that don't to the
 * other side.
 */
export const moveTermsToOneSide: Transform = (node, ident) => {
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
