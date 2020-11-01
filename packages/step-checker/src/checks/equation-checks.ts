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

    const [lhsA, rhsA] = prev.args;
    const [lhsB, rhsB] = next.args;

    if (lhsB.type === "add" && rhsB.type === "add") {
        const lhsATerms = Semantic.getTerms(lhsA);
        const rhsATerms = Semantic.getTerms(rhsA);

        const lhsNewTerms = difference(
            Semantic.getTerms(lhsB),
            lhsATerms,
            context,
        );
        const rhsNewTerms = difference(
            Semantic.getTerms(rhsB),
            rhsATerms,
            context,
        );

        const result1 = checker.checkStep(
            Semantic.addTerms(lhsNewTerms),
            Semantic.addTerms(rhsNewTerms),
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
        if (!result1) {
            return;
        }

        if (lhsNewTerms.length === 0 || rhsNewTerms.length === 0) {
            // TODO: write a test for this
            return;
        }

        // We prefer adding fewer terms to both sides.
        const newTerms =
            lhsNewTerms.length < rhsNewTerms.length ? lhsNewTerms : rhsNewTerms;

        const newPrev = Semantic.eq([
            Semantic.add([...lhsATerms, ...newTerms] as TwoOrMore<
                Semantic.Expression
            >),
            Semantic.add([...rhsATerms, ...newTerms] as TwoOrMore<
                Semantic.Expression
            >),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result2 = checker.checkStep(newPrev, next, {
            ...context,
            filters: {
                // prevent an infinite loop
                disallowedChecks: new Set(["checkAddSub"]),
            },
        });

        if (result1 && result2) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result2.steps,
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

    const [lhsA, rhsA] = prev.args;
    const [lhsB, rhsB] = next.args;

    if (lhsB.type === "mul" && rhsB.type === "mul") {
        const lhsAFactors = Semantic.getFactors(lhsA);
        const rhsAFactors = Semantic.getFactors(rhsA);

        const lhsNewFactors = difference(
            Semantic.getFactors(lhsB),
            lhsAFactors,
            context,
        );
        const rhsNewFactors = difference(
            Semantic.getFactors(rhsB),
            rhsAFactors,
            context,
        );
        const equivalent = checker.checkStep(
            Semantic.mulFactors(lhsNewFactors),
            Semantic.mulFactors(rhsNewFactors),
            context,
        );

        if (!equivalent) {
            return;
        }

        // We prefer multiplying both sides by fewer factors.
        const newFactors =
            lhsNewFactors.length < rhsNewFactors.length
                ? lhsNewFactors
                : rhsNewFactors;

        const newPrev = Semantic.eq([
            Semantic.mul([...lhsAFactors, ...newFactors] as TwoOrMore<
                Semantic.Expression
            >),
            Semantic.mul([...rhsAFactors, ...newFactors] as TwoOrMore<
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

    const [lhsA, rhsA] = prev.args;
    const [lhsB, rhsB] = next.args;

    if (lhsB.type === "div" && rhsB.type === "div") {
        if (
            checker.checkStep(lhsA, lhsB.args[NUMERATOR], context) &&
            checker.checkStep(rhsA, rhsB.args[NUMERATOR], context)
        ) {
            const result = checker.checkStep(
                lhsB.args[DENOMINATOR],
                rhsB.args[DENOMINATOR],
                context,
            );

            if (result) {
                return correctResult(
                    prev,
                    next,
                    context.reversed,
                    [],
                    [],
                    "divide both sides by the same value",
                    "remove division by the same amount",
                );
            }
        }
    }
};
checkDiv.symmetric = true;
