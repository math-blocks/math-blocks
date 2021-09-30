import * as Semantic from "@math-blocks/semantic";

import {isTermOfIdent, flipSign} from "../util";
import {simplifyBothSides} from "./simplify-both-sides";

import type {Step} from "../../types";

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
    const originalBefore = before;

    let [left, right] = before.args as readonly Semantic.types.NumericNode[];

    const leftTerms = Semantic.util.getTerms(left);
    const rightTerms = Semantic.util.getTerms(right);

    const leftIdentTerms = leftTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );

    const rightNonIdentTerms = rightTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );

    if (leftIdentTerms.length === 0 && rightNonIdentTerms.length === 0) {
        // Terms have already been separated.
        return undefined;
    }

    const rightIdentTerms = rightTerms.filter((term) =>
        isTermOfIdent(term, ident),
    );

    const leftNonIdentTerms = leftTerms.filter(
        (term) => !isTermOfIdent(term, ident),
    );

    if (rightIdentTerms.length === 0 && leftNonIdentTerms.length === 0) {
        // Terms have already been separated.
        return undefined;
    }

    let newLeft;
    let newRight;

    const substeps: Step<Semantic.types.Eq<Semantic.types.Node>>[] = [];

    for (const leftNonIdentTerm of leftNonIdentTerms) {
        newLeft = Semantic.builders.add([
            ...Semantic.util.getTerms(left),
            flipSign(leftNonIdentTerm),
        ]);
        newRight = Semantic.builders.add([
            ...Semantic.util.getTerms(right),
            flipSign(leftNonIdentTerm),
        ]);
        const after = Semantic.builders.eq([newLeft, newRight]);
        substeps.push({
            message: "subtract term from both sides",
            before: before,
            after: after,
            substeps: [],
        });
        const step = simplifyBothSides(after) as void | Step<
            Semantic.types.Eq<Semantic.types.NumericNode>
        >;
        if (step) {
            before = after;
            const newAfter = step.after;
            substeps.push({
                message: "simplify both sides",
                before: before,
                after: newAfter,
                substeps: step.substeps,
            });
            left = newAfter.args[0];
            right = newAfter.args[1];
            before = newAfter;
            /* istanbul ignore */
        } else {
            left = newLeft;
            right = newRight;
            before = after;
        }
    }

    for (const rightIdentTerm of rightIdentTerms) {
        newLeft = Semantic.builders.add([
            ...Semantic.util.getTerms(left),
            flipSign(rightIdentTerm),
        ]);
        newRight = Semantic.builders.add([
            ...Semantic.util.getTerms(right),
            flipSign(rightIdentTerm),
        ]);
        const after = Semantic.builders.eq([newLeft, newRight]);
        substeps.push({
            message: "subtract term from both sides",
            before: before,
            after: after,
            substeps: [],
        });
        const step = simplifyBothSides(after) as void | Step<
            Semantic.types.Eq<Semantic.types.NumericNode>
        >;
        if (step) {
            before = after;
            const newAfter = step.after;
            substeps.push({
                message: "simplify both sides",
                before: before,
                after: newAfter,
                substeps: step.substeps,
            });
            left = newAfter.args[0];
            right = newAfter.args[1];
            before = newAfter;
            /* istanbul ignore */
        } else {
            left = newLeft;
            right = newRight;
            before = after;
        }
    }

    // TODO: determine if there were any changes between before and after
    return {
        message: "move terms to one side",
        before: originalBefore,
        after: substeps[substeps.length - 1].after,
        substeps: substeps,
    };
}
