import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";
import {difference, correctResult} from "./util";

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

    if (nextLHS.type === "add" && nextRHS.type === "add") {
        const prevTermsLHS = Semantic.getTerms(prevLHS);
        const prevTermsRHS = Semantic.getTerms(prevRHS);

        const newTermsLHS = difference(
            Semantic.getTerms(nextLHS),
            prevTermsLHS,
            context,
        );
        const newTermsRHS = difference(
            Semantic.getTerms(nextRHS),
            prevTermsRHS,
            context,
        );

        const areNewTermsEquivalent = checker.checkStep(
            Semantic.addTerms(newTermsLHS),
            Semantic.addTerms(newTermsRHS),
            {
                ...context,
                filters: {
                    // prevent an infinite loop
                    disallowedChecks: new Set(["checkAddSub"]),
                },
            },
        );

        // If what we're adding to both sides isn't equivalent then fail
        // TODO: report this error back to the user
        if (!areNewTermsEquivalent) {
            return;
        }

        if (newTermsLHS.length === 0 || newTermsRHS.length === 0) {
            // TODO: write a test for this
            return;
        }

        // We prefer adding fewer terms to both sides.
        const newTerms =
            newTermsLHS.length < newTermsRHS.length ? newTermsLHS : newTermsRHS;

        const newPrev = Semantic.eq([
            Semantic.add([...prevTermsLHS, ...newTerms] as TwoOrMore<
                Semantic.Expression
            >),
            Semantic.add([...prevTermsRHS, ...newTerms] as TwoOrMore<
                Semantic.Expression
            >),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result = checker.checkStep(newPrev, next, {
            ...context,
            filters: {
                // prevent an infinite loop
                disallowedChecks: new Set(["checkAddSub"]),
            },
        });

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

    if (nextLHS.type === "mul" && nextRHS.type === "mul") {
        const prevFactorsLHS = Semantic.getFactors(prevLHS);
        const prevFactorsRHS = Semantic.getFactors(prevRHS);

        const newFactorsLHS = difference(
            Semantic.getFactors(nextLHS),
            prevFactorsLHS,
            context,
        );
        const newFactorsRHS = difference(
            Semantic.getFactors(nextRHS),
            prevFactorsRHS,
            context,
        );

        const areNewFactorsEquivalent = checker.checkStep(
            Semantic.mulFactors(newFactorsLHS),
            Semantic.mulFactors(newFactorsRHS),
            context,
        );

        // If what we're multiplying both sides by isn't equivalent then fail
        // TODO: report this error back to the user
        if (!areNewFactorsEquivalent) {
            return;
        }

        // We prefer multiplying both sides by fewer factors.
        const newFactors =
            newFactorsLHS.length < newFactorsRHS.length
                ? newFactorsLHS
                : newFactorsRHS;

        const newPrev = Semantic.eq([
            Semantic.mul([...prevFactorsLHS, ...newFactors] as TwoOrMore<
                Semantic.Expression
            >),
            Semantic.mul([...prevFactorsRHS, ...newFactors] as TwoOrMore<
                Semantic.Expression
            >),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result = checker.checkStep(newPrev, next, {
            ...context,
            filters: {
                // prevent an infinite loop
                disallowedChecks: new Set(["checkAddSub"]),
            },
        });

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

            const denFactorsLSH = Semantic.getFactors(
                nextLHS.args[DENOMINATOR],
            );
            const denFactorsRHS = Semantic.getFactors(
                nextRHS.args[DENOMINATOR],
            );

            const denFactors =
                denFactorsLSH.length < denFactorsRHS.length
                    ? denFactorsLSH
                    : denFactorsRHS;

            const newPrev = Semantic.eq([
                Semantic.div(prevLHS, Semantic.mulFactors(denFactors)),
                Semantic.div(prevRHS, Semantic.mulFactors(denFactors)),
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
