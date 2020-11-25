import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";
import {MistakeId} from "../enums";
import {difference, correctResult, intersection} from "./util";

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
        !Semantic.isNumeric(prevLHS) ||
        !Semantic.isNumeric(prevRHS) ||
        !Semantic.isNumeric(nextLHS) ||
        !Semantic.isNumeric(nextRHS)
    ) {
        return;
    }

    // TODO: take into account LHS and RHS being swapped
    // e.g. y = x -> x + 10 = y + 10
    if (nextLHS.type === "add" || nextRHS.type === "add") {
        const prevTermsLHS = Semantic.getTerms(prevLHS);
        const prevTermsRHS = Semantic.getTerms(prevRHS);
        const nextTermsLHS = Semantic.getTerms(nextLHS);
        const nextTermsRHS = Semantic.getTerms(nextRHS);

        // Which terms from the previous step appear in the next step on each
        // side.
        const oldTermsLHS = intersection(nextTermsLHS, prevTermsLHS);
        const oldTermsRHS = intersection(nextTermsRHS, prevTermsRHS);

        // All previous terms for each side should appear in the next step as
        // terms as well.  If any are missing then we're doing something other
        // than adding something to both sides.
        if (
            oldTermsLHS.length !== prevTermsLHS.length ||
            oldTermsRHS.length !== prevTermsRHS.length
        ) {
            return;
        }

        const newTermsLHS = difference(nextTermsLHS, prevTermsLHS);
        const newTermsRHS = difference(nextTermsRHS, prevTermsRHS);

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

        // If what we're adding to both sides isn't equivalent then report that
        // this step was incorrect and include which nodes weren't the same.
        if (!areNewTermsEquivalent) {
            context.mistakes.push({
                id: MistakeId.EQN_ADD_DIFF,
                // TODO: make structures that are specific to each mistake
                nodes: [...newTermsLHS, ...newTermsRHS],
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

        const newPrev = Semantic.eq([
            Semantic.add([...prevTermsLHS, ...newTerms] as TwoOrMore<
                Semantic.Types.NumericExpression
            >),
            Semantic.add([...prevTermsRHS, ...newTerms] as TwoOrMore<
                Semantic.Types.NumericExpression
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

    // TODO: take into account LHS and RHS being swapped
    // e.g. y = x -> x * 10 = y * 10
    if (nextLHS.type === "mul" || nextRHS.type === "mul") {
        if (
            !Semantic.isNumeric(prevLHS) ||
            !Semantic.isNumeric(prevRHS) ||
            !Semantic.isNumeric(nextLHS) ||
            !Semantic.isNumeric(nextRHS)
        ) {
            return;
        }

        const prevFactorsLHS = Semantic.getFactors(prevLHS);
        const prevFactorsRHS = Semantic.getFactors(prevRHS);
        const nextFactorsLHS = Semantic.getFactors(nextLHS);
        const nextFacotrsRHS = Semantic.getFactors(nextRHS);

        const oldFactorsLHS = intersection(nextFactorsLHS, prevFactorsLHS);
        const oldFactorsRHS = intersection(nextFacotrsRHS, prevFactorsRHS);

        // All previous factors for each side should appear in the next step as
        // factors as well.  If any are missing then we're doing something other
        // than multiplying something to both sides.
        if (
            oldFactorsLHS.length !== prevFactorsLHS.length ||
            oldFactorsRHS.length !== prevFactorsRHS.length
        ) {
            return;
        }

        const newFactorsLHS = difference(
            Semantic.getFactors(nextLHS),
            prevFactorsLHS,
        );
        const newFactorsRHS = difference(
            Semantic.getFactors(nextRHS),
            prevFactorsRHS,
        );

        const areNewFactorsEquivalent = checker.checkStep(
            Semantic.mulFactors(newFactorsLHS),
            Semantic.mulFactors(newFactorsRHS),
            context,
        );

        // If what we're multiplying both sides by isn't equivalent then fail
        if (!areNewFactorsEquivalent) {
            context.mistakes.push({
                id: MistakeId.EQN_MUL_DIFF,
                // TODO: make structures that are specific to each mistake
                nodes: [...newFactorsLHS, ...newFactorsRHS],
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
        const newPrev = Semantic.eq([
            Semantic.mul([...newFactors, ...prevFactorsLHS] as TwoOrMore<
                Semantic.Types.NumericExpression
            >),
            Semantic.mul([...newFactors, ...prevFactorsRHS] as TwoOrMore<
                Semantic.Types.NumericExpression
            >),
        ]);

        // This checkStep allows for commutation of the result, but doesn't
        // handle evaluation that might happen during result1.
        const result = checker.checkStep(newPrev, next, {
            ...context,
            filters: {
                // prevent an infinite loop
                disallowedChecks: new Set(["checkMul"]),
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

// export const checkBadMul: Check = (prev, next, context) => {
//     if (prev.type !== "eq" || next.type !== "eq") {
//         return;
//     }

//     const {checker} = context;

//     const [prevLHS, prevRHS] = prev.args;
//     const [nextLHS, nextRHS] = next.args;

//     // TODO: take into account LHS and RHS being swapped
//     // e.g. y = x -> x * 10 = y * 10
//     if (nextLHS.type === "mul" || nextRHS.type === "add") {
//         const prevFactorsLHS = Semantic.getFactors(prevLHS);
//         const nextFactorsLHS = Semantic.getFactors(nextLHS);

//         const oldFactorsLHS = intersection(
//             nextFactorsLHS,
//             prevFactorsLHS,
//             context,
//         );

//         // If one of the sides has no old factors then we're doing something
//         // other than multiplying both sides by some value.
//         if (oldFactorsLHS.length === 0) {
//             return;
//         }

//         const newFactorsLHS = difference(
//             Semantic.getFactors(nextLHS),
//             prevFactorsLHS,
//             context,
//         );

//         // TODO: find new factor being multiplied by one of the terms in RHS

//         const areNewFactorsEquivalent = checker.checkStep(
//             Semantic.mulFactors(newFactorsLHS),
//             Semantic.mulFactors(newFactorsRHS),
//             context,
//         );

//         // // If what we're multiplying both sides by isn't equivalent then fail
//         // // TODO: report this error back to the user
//         // if (!areNewFactorsEquivalent) {
//         //     return incorrectResult(
//         //         prev,
//         //         next,
//         //         context.reversed,
//         //         [],
//         //         [],
//         //         "different values were multiplied on both sides",
//         //     );
//         // }

//         // // We prefer multiplying both sides by fewer factors.
//         // const newFactors =
//         //     newFactorsLHS.length < newFactorsRHS.length
//         //         ? newFactorsLHS
//         //         : newFactorsRHS;

//         // // We place the new factors at the start since it is common to go
//         // // from x = y -> 2x = 2y or x + 1 = y - 2 -> 5(x + 1) = 5(y - 2)
//         // const newPrev = Semantic.eq([
//         //     Semantic.mul([...newFactors, ...prevFactorsLHS] as TwoOrMore<
//         //         Semantic.Expression
//         //     >),
//         //     Semantic.mul([...newFactors, ...prevFactorsRHS] as TwoOrMore<
//         //         Semantic.Expression
//         //     >),
//         // ]);

//         // // This checkStep allows for commutation of the result, but doesn't
//         // // handle evaluation that might happen during result1.
//         // const result = checker.checkStep(newPrev, next, {
//         //     ...context,
//         //     filters: {
//         //         // prevent an infinite loop
//         //         disallowedChecks: new Set(["checkMul"]),
//         //     },
//         // });

//         // if (result) {
//         //     return correctResult(
//         //         prev,
//         //         newPrev,
//         //         context.reversed,
//         //         [],
//         //         result.steps,
//         //         "multiply both sides by the same value",
//         //         "remove multiplication from both sides",
//         //     );
//         // }
//     }
// };
// checkMul.symmetric = true;

export const checkDiv: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return;
    }

    const {checker} = context;

    const [prevLHS, prevRHS] = prev.args;
    const [nextLHS, nextRHS] = next.args;

    if (!Semantic.isNumeric(prevLHS) || !Semantic.isNumeric(prevRHS)) {
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
