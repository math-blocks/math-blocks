import * as Semantic from "@math-blocks/semantic";

import {isTermOfIdent, flipSign, convertSubTermToNeg} from "../util";

import type {Step} from "../../types";

const {NodeType} = Semantic;

/**
 * Moves all terms matching `ident` to one side and those that don't to the
 * other side.
 *
 * TODO:
 * - customize messages in steps
 * - add sub-steps for:
 *   - the addition/subtraction that needs to be done to both sides to
 *     move something
 *   - showing the cancelling of terms after the addition/subtraction
 *   - the case where we're moving both matching and non-matching terms in
 *     opposite directions
 */
export function moveTermsToOneSide(
    before: Semantic.types.Eq,
    ident: Semantic.types.Identifier,
): Step<Semantic.types.Eq> | void {
    const [left, right] = before.args as readonly Semantic.types.NumericNode[];

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

    if (leftIdentTerms.length > 1 || rightIdentTerms.length > 1) {
        // One (or both) of the sides hasn't been simplified
        return undefined;
    }

    if (leftIdentTerms.length === 1 && rightIdentTerms.length === 1) {
        // There's a term with the identifier we're trying to solve for on both sides

        // TODO: create two sub-steps for each of these moves
        // Move identifiers to the left
        const left =
            leftIdentTerms[0].type === NodeType.Neg
                ? Semantic.builders.add([
                      convertSubTermToNeg(leftIdentTerms[0]),
                      ...leftIdentTerms.slice(1),
                      ...rightIdentTerms.map(flipSign),
                  ])
                : Semantic.builders.add([
                      ...leftIdentTerms,
                      ...rightIdentTerms.map(flipSign),
                  ]);

        // Move non-identifiers to the right
        const right = Semantic.builders.add([
            ...rightNonIdentTerms,
            ...leftNonIdentTerms.map(flipSign),
        ]);

        const after = Semantic.builders.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
    }

    if (
        leftIdentTerms.length === 1 &&
        rightIdentTerms.length === 0 &&
        leftNonIdentTerms.length > 0
    ) {
        let left = Semantic.builders.add([
            leftIdentTerms[0],
            ...leftNonIdentTerms,
            ...leftNonIdentTerms.map(flipSign),
        ]);

        // TODO: run this check on leftIdentTerms[0]
        if (left.type === NodeType.Neg) {
            left = convertSubTermToNeg(left);
        }

        // Move non-identifiers to the right.
        const right = Semantic.builders.add([
            ...rightNonIdentTerms,
            ...leftNonIdentTerms.map(flipSign),
        ]);

        const after = Semantic.builders.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
    }

    if (
        leftIdentTerms.length === 0 &&
        rightIdentTerms.length === 1 &&
        rightNonIdentTerms.length > 0
    ) {
        // Move non-identifiers to the left.
        const left = Semantic.builders.add([
            ...leftNonIdentTerms,
            ...rightNonIdentTerms.map(flipSign),
        ]);

        let right = rightIdentTerms[0];
        if (right.type === NodeType.Neg) {
            right = convertSubTermToNeg(right);
        }

        const after = Semantic.builders.eq([left, right]);
        return {
            message: "move terms to one side",
            before,
            after,
            substeps: [],
        };
    }

    return undefined;
}
