import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";
import {MistakeId} from "../enums";
import {correctResult} from "./util";

// TODO: create sub-steps that includes the opposite operation when reversed is true
// TODO: include which nodes were added/removed in each reason
// TODO: handle square rooting both sides
// TODO: handle applying the same exponent to both sides

const NUMERATOR = 0;
const DENOMINATOR = 1;

export const checkAddSub: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return;
    }

    const {checker} = context;

    const [prevLHS, prevRHS] = prev.args;
    const [nextLHS, nextRHS] = next.args;

    if (
        !Semantic.util.isNumeric(prevLHS) ||
        !Semantic.util.isNumeric(prevRHS) ||
        !Semantic.util.isNumeric(nextLHS) ||
        !Semantic.util.isNumeric(nextRHS)
    ) {
        return;
    }

    // TODO: take into account LHS and RHS being swapped
    // e.g. y = x -> x + 10 = y + 10
    if (nextLHS.type === "add" || nextRHS.type === "add") {
        const prevTermsLHS = Semantic.util.getTerms(prevLHS);
        const prevTermsRHS = Semantic.util.getTerms(prevRHS);
        const nextTermsLHS = Semantic.util.getTerms(nextLHS);
        const nextTermsRHS = Semantic.util.getTerms(nextRHS);

        // Which terms from the previous step appear in the next step on each
        // side.
        const oldTermsLHS = Semantic.util.intersection(
            nextTermsLHS,
            prevTermsLHS,
        );
        const oldTermsRHS = Semantic.util.intersection(
            nextTermsRHS,
            prevTermsRHS,
        );

        // All previous terms for each side should appear in the next step as
        // terms as well.  If any are missing then we're doing something other
        // than adding something to both sides.
        if (
            oldTermsLHS.length !== prevTermsLHS.length ||
            oldTermsRHS.length !== prevTermsRHS.length
        ) {
            return;
        }

        const newTermsLHS = Semantic.util.difference(
            nextTermsLHS,
            prevTermsLHS,
        );
        const newTermsRHS = Semantic.util.difference(
            nextTermsRHS,
            prevTermsRHS,
        );

        const areNewTermsEquivalent = checker.checkStep(
            Semantic.builders.add(newTermsLHS),
            Semantic.builders.add(newTermsRHS),
            context,
        );

        // If what we're adding to both sides isn't equivalent then report that
        // this step was incorrect and include which nodes weren't the same.
        if (!areNewTermsEquivalent) {
            if (!context.mistakes) {
                return;
            }
            context.mistakes.push({
                id: MistakeId.EQN_ADD_DIFF,
                // TODO: make structures that are specific to each mistake
                // In this case we might like to differentiate between new terms
                // on the LHS from those on the RHS.
                prevNodes: context.reversed
                    ? [...newTermsLHS, ...newTermsRHS]
                    : [],
                nextNodes: context.reversed
                    ? []
                    : [...newTermsLHS, ...newTermsRHS],
                corrections: [],
            });
            return;
        }

        if (newTermsLHS.length === 0 || newTermsRHS.length === 0) {
            // TODO: write a test for this
            return;
        }

        // We prefer adding fewer terms to both sides.
        const newTerms =
            newTermsLHS.length < newTermsRHS.length ? newTermsLHS : newTermsRHS;

        const newPrev = Semantic.builders.eq([
            Semantic.builders.add([...prevTermsLHS, ...newTerms]),
            Semantic.builders.add([...prevTermsRHS, ...newTerms]),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "adding the same value to both sides",
                "removing adding the same value to both sides",
            );
        }
    }
};
checkAddSub.symmetric = true;

export const checkMul: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return;
    }

    const {checker} = context;

    const [prevLHS, prevRHS] = prev.args;
    const [nextLHS, nextRHS] = next.args;

    // TODO: take into account LHS and RHS being swapped
    // e.g. y = x -> x * 10 = y * 10
    if (nextLHS.type === "mul" || nextRHS.type === "mul") {
        if (
            !Semantic.util.isNumeric(prevLHS) ||
            !Semantic.util.isNumeric(prevRHS) ||
            !Semantic.util.isNumeric(nextLHS) ||
            !Semantic.util.isNumeric(nextRHS)
        ) {
            return;
        }

        const prevFactorsLHS = Semantic.util.getFactors(prevLHS);
        const prevFactorsRHS = Semantic.util.getFactors(prevRHS);
        const nextFactorsLHS = Semantic.util.getFactors(nextLHS);
        const nextFacotrsRHS = Semantic.util.getFactors(nextRHS);

        const oldFactorsLHS = Semantic.util.intersection(
            nextFactorsLHS,
            prevFactorsLHS,
        );
        const oldFactorsRHS = Semantic.util.intersection(
            nextFacotrsRHS,
            prevFactorsRHS,
        );

        // All previous factors for each side should appear in the next step as
        // factors as well.  If any are missing then we're doing something other
        // than multiplying something to both sides.
        if (
            oldFactorsLHS.length !== prevFactorsLHS.length ||
            oldFactorsRHS.length !== prevFactorsRHS.length
        ) {
            return;
        }

        const newFactorsLHS = Semantic.util.difference(
            Semantic.util.getFactors(nextLHS),
            prevFactorsLHS,
        );
        const newFactorsRHS = Semantic.util.difference(
            Semantic.util.getFactors(nextRHS),
            prevFactorsRHS,
        );

        const areNewFactorsEquivalent = checker.checkStep(
            Semantic.builders.mul(newFactorsLHS),
            Semantic.builders.mul(newFactorsRHS),
            context,
        );

        // If what we're multiplying both sides by isn't equivalent then fail
        if (!areNewFactorsEquivalent) {
            if (!context.mistakes) {
                return;
            }
            context.mistakes.push({
                id: MistakeId.EQN_MUL_DIFF,
                // TODO: make structures that are specific to each mistake
                // In this case we might like to differentiate between new factors
                // on the LHS from those on the RHS.
                prevNodes: context.reversed
                    ? [...newFactorsLHS, ...newFactorsRHS]
                    : [],
                nextNodes: context.reversed
                    ? []
                    : [...newFactorsLHS, ...newFactorsRHS],
                corrections: [],
            });
            return;
        }

        // We prefer multiplying both sides by fewer factors.
        const newFactors =
            newFactorsLHS.length < newFactorsRHS.length
                ? newFactorsLHS
                : newFactorsRHS;

        // We place the new factors at the start since it is common to go
        // from x = y -> 2x = 2y or x + 1 = y - 2 -> 5(x + 1) = 5(y - 2)
        const newPrev = Semantic.builders.eq([
            Semantic.builders.mul([...newFactors, ...prevFactorsLHS]),
            Semantic.builders.mul([...newFactors, ...prevFactorsRHS]),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "multiply both sides by the same value",
                "remove multiplication from both sides",
            );
        }
    }
};
checkMul.symmetric = true;

export const checkDiv: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return;
    }

    const {checker} = context;

    const [prevLHS, prevRHS] = prev.args;
    const [nextLHS, nextRHS] = next.args;

    if (
        !Semantic.util.isNumeric(prevLHS) ||
        !Semantic.util.isNumeric(prevRHS)
    ) {
        return;
    }

    if (nextLHS.type === "div" && nextRHS.type === "div") {
        if (
            checker.checkStep(prevLHS, nextLHS.args[NUMERATOR], context) &&
            checker.checkStep(prevRHS, nextRHS.args[NUMERATOR], context)
        ) {
            const areDenominatorsEquivalent = checker.checkStep(
                nextLHS.args[DENOMINATOR],
                nextRHS.args[DENOMINATOR],
                context,
            );

            if (!areDenominatorsEquivalent) {
                return;
            }

            const denFactorsLSH = Semantic.util.getFactors(
                nextLHS.args[DENOMINATOR],
            );
            const denFactorsRHS = Semantic.util.getFactors(
                nextRHS.args[DENOMINATOR],
            );

            const denFactors =
                denFactorsLSH.length < denFactorsRHS.length
                    ? denFactorsLSH
                    : denFactorsRHS;

            const newPrev = Semantic.builders.eq([
                Semantic.builders.div(
                    prevLHS,
                    Semantic.builders.mul(denFactors),
                ),
                Semantic.builders.div(
                    prevRHS,
                    Semantic.builders.mul(denFactors),
                ),
            ]);

            const result = checker.checkStep(newPrev, next, context);

            if (result) {
                return correctResult(
                    prev,
                    newPrev,
                    context.reversed,
                    [],
                    result.steps,
                    "divide both sides by the same value",
                    "remove division by the same amount",
                );
            }
        }
    }
};
checkDiv.symmetric = true;
