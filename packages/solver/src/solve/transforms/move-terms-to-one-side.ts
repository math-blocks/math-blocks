import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {isTermOfIdent, flipSign, convertSubTermToNeg} from "../util";

/**
 * Moves all terms matching `ident` to one side and those that don't to the
 * other side.
 *
 * TODO:
 * - customize messages in steps
 * - add sub-steps for the case where we're moving both matching and non-matching
 *   terms in opposite directions
 */
export const moveTermsToOneSide: Transform = (before, ident) => {
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

    if (leftIdentTerms.length > 1 || rightIdentTerms.length > 1) {
        // One (or both) of the sides hasn't been simplified
        return undefined;
    }

    if (leftIdentTerms.length === 1 && rightIdentTerms.length === 1) {
        // There's a term with the identifier we're trying to solve for on both sides

        // TODO: create two sub-steps for each of these moves
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

        const after = Semantic.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
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

        const after = Semantic.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
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

        const after = Semantic.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
    }

    return undefined;
};
