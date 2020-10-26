import * as Semantic from "@math-blocks/semantic";

import {
    applySteps,
    decomposeFactors,
    difference,
    equality,
    exactMatch,
    intersection,
} from "../util";
import {Check} from "../types";
import {FAILED_CHECK} from "../constants";

// TODO: Consider simplifying substeps for dividing integers.  Right now
// we do the following:
// 30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5
// There is precedent for this with evaluateMul, we could have evaluateDiv

export const checkDivisionCanceling: Check = (prev, next, context) => {
    if (prev.type !== "div") {
        return FAILED_CHECK;
    }
    const {checker} = context;
    const [numeratorA, denominatorA] = prev.args;
    // Include ONE as a factor to handle cases where the denominator disappears
    // or the numerator chnages to 1.
    const numFactorsA = Semantic.getFactors(numeratorA);
    const denFactorsA = Semantic.getFactors(denominatorA);

    // cases:
    // - ab/ac -> a/a * b/c
    // - ab/a -> a/1 -> a
    const [numeratorB, denominatorB] =
        next.type === "div" ? next.args : [next, Semantic.number("1")];

    // Include ONE as a factor to handle cases where the denominator disappears
    // or the numerator chnages to 1.
    const numFactorsB = Semantic.getFactors(numeratorB);
    const denFactorsB = Semantic.getFactors(denominatorB);

    // Ensure that no extra factors were added to either the numerator
    // or denominator.  It's okay to ignore factors that ONE since multiplying
    // by 1 doesn't affect the value of the numerator or denominator.
    const addedNumFactors = difference(numFactorsB, numFactorsA, context);
    const addedDenFactors = difference(denFactorsB, denFactorsA, context);

    if (
        !checker.checkStep(
            Semantic.mulFactors(addedNumFactors),
            Semantic.number("1"),
            context,
        ) ||
        !checker.checkStep(
            Semantic.mulFactors(addedDenFactors),
            Semantic.number("1"),
            context,
        )
    ) {
        // If the factors are different then it's possible that the user
        // decomposed one or more of the factors.  We decompose all factors
        // in both the current step `a` and the next step `b` and re-run
        // checkDivisionCanceling on the new fractions to see if that's the
        // case.
        const factoredNumFactorsA = decomposeFactors(numFactorsA);
        const factoredDenFactorsA = decomposeFactors(denFactorsA);
        const factoredNumFactorsB = decomposeFactors(numFactorsB);
        const factoredDenFactorsB = decomposeFactors(denFactorsB);

        if (
            factoredNumFactorsA.length !== numFactorsA.length ||
            factoredDenFactorsA.length !== denFactorsA.length
        ) {
            const newPrev = Semantic.div(
                Semantic.mulFactors(factoredNumFactorsA),
                Semantic.mulFactors(factoredDenFactorsA),
            );
            const newNext = Semantic.div(
                Semantic.mulFactors(factoredNumFactorsB),
                Semantic.mulFactors(factoredDenFactorsB),
            );

            // TODO: allow `nodes` in Reason type to have more than two nodes
            // to handle cases where we modify both prev and next to work the
            // problem from both sides essentially.
            const result1 = checkDivisionCanceling(newPrev, newNext, context);

            // Because we're also creating a new step coming from the opposite
            // direction, we need to check that that step will also work.
            const result2 = checker.checkStep(newNext, next, context);

            if (result1 && result2) {
                return {
                    steps: [
                        {
                            message: "prime factorization",
                            nodes: [prev, newPrev],
                        },
                        ...result1.steps,
                        ...result2.steps,
                    ],
                };
            }
        }

        // TODO: Add reason for why the canceling check failed
        return FAILED_CHECK;
    }

    // TODO: figure out how to handle duplicate factors
    const removedNumFactors = difference(numFactorsA, numFactorsB, context);
    const remainingNumFactors = intersection(numFactorsA, numFactorsB, context);
    const removedDenFactors = difference(denFactorsA, denFactorsB, context);
    const remainingDenFactors = intersection(denFactorsA, denFactorsB, context);

    if (remainingNumFactors.length === 0) {
        remainingNumFactors.push(Semantic.number("1"));
    }

    if (remainingDenFactors.length === 0) {
        remainingDenFactors.push(Semantic.number("1"));
    }

    // ab/ac -> a/a * b/c
    if (
        removedNumFactors.length > 0 &&
        removedNumFactors.length === removedDenFactors.length &&
        equality(removedNumFactors, removedDenFactors, context)
    ) {
        const productA = Semantic.mulFactors([
            Semantic.div(
                Semantic.mulFactors(removedNumFactors, true),
                Semantic.mulFactors(removedDenFactors, true),
            ),
            Semantic.div(
                Semantic.mulFactors(remainingNumFactors, true),
                Semantic.mulFactors(remainingDenFactors, true),
            ),
        ]);

        const result = checker.checkStep(productA, next, context);
        if (result) {
            return {
                steps: [
                    {
                        message:
                            "extract common factors from numerator and denominator",
                        nodes: [prev, productA],
                    },
                    ...result.steps,
                ],
            };
        }
    }

    return FAILED_CHECK;
};

checkDivisionCanceling.symmetric = true;

// TODO: handle this in the same way we handle other symmetric checks
export const divByFrac: Check = (prev, next, context) => {
    const {checker} = context;
    if (prev.type !== "div") {
        return FAILED_CHECK;
    }

    const [numerator, denominator] = prev.args;

    if (denominator.type === "div") {
        const reciprocal = Semantic.div(
            denominator.args[1],
            denominator.args[0],
        );
        const newPrev = Semantic.mulFactors([numerator, reciprocal]);
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return {
                steps: [
                    {
                        message:
                            "dividing by a fraction is the same as multiplying by the reciprocal",
                        nodes: [prev, newPrev],
                    },
                    ...result.steps,
                ],
            };
        }
    }

    return FAILED_CHECK;
};

divByFrac.symmetric = true;

export const divByOne: Check = (prev, next, context) => {
    const {checker} = context;
    if (
        prev.type === "div" &&
        checker.checkStep(prev.args[1], Semantic.number("1"), context)
    ) {
        const result = checker.checkStep(prev.args[0], next, context);

        if (result) {
            const newPrev = applySteps(prev, result.steps);
            return {
                steps: [
                    ...result.steps,
                    {
                        message: "division by one",
                        nodes: [newPrev, next],
                    },
                ],
            };
        }
    }

    // TODO: handle this in the same way we handle other symmetric checks
    // const newPrev = Semantic.div(prev, Semantic.number("1"));
    // const result = checker.checkStep(newPrev, next, {
    //     ...context,
    //     filters: {
    //         disallowedChecks: new Set([divByOne.name]),
    //     },
    // });

    // if (result) {
    //     return {
    //         steps: context.reversed
    //             ? [
    //                   ...result.steps,
    //                   {
    //                       message: "division by one",
    //                       nodes: [newPrev, prev],
    //                   },
    //               ]
    //             : [
    //                   {
    //                       message: "division by one",
    //                       nodes: [prev, newPrev],
    //                   },
    //                   ...result.steps,
    //               ],
    //     };
    // }

    return FAILED_CHECK;
};

divByOne.symmetric = true;

// TODO: handle this in the same way we handle other symmetric checks
export const divBySame: Check = (prev, next, context) => {
    const {checker} = context;
    if (prev.type === "div") {
        const [numerator, denominator] = prev.args;
        const one = Semantic.number("1");
        const result1 = checker.checkStep(numerator, denominator, context);
        const result2 = checker.checkStep(next, one, context);
        if (result1 && result2) {
            return {
                steps: [
                    ...result1.steps,
                    {
                        message: "division by the same value",
                        nodes: [prev, one],
                    },
                    ...result2.steps,
                ],
            };
        }
    }
    return FAILED_CHECK;
};

divBySame.symmetric = true;

// TODO: handle this in the same way we handle other symmetric checks
export const divIsMulByOneOver: Check = (prev, next, context) => {
    const {checker} = context;

    // TODO: check if the div is a child of a mul node
    if (
        prev.type === "div" &&
        !exactMatch(prev.args[0], Semantic.number("1"), context)
    ) {
        const newPrev = Semantic.mulFactors([
            prev.args[0],
            Semantic.div(Semantic.number("1"), prev.args[1]),
        ]);

        // TODO: write more tests to check that all of this is correct
        const step = {
            message: context.reversed
                ? "multiplying by one over something results in a fraction"
                : "fraction is the same as multiplying by one over",
            nodes: context.reversed ? [newPrev, prev] : [prev, newPrev],
        };

        const result = checker.checkStep(newPrev, next, {
            ...context,
            steps: [...context.steps, step],
        });

        if (result) {
            return {
                steps: context.reversed
                    ? [...result.steps, step]
                    : [step, ...result.steps],
            };
        }
    }

    return FAILED_CHECK;
};

divIsMulByOneOver.symmetric = true;

// TODO: handle this in the same way we handle other symmetric checks
export const mulByFrac: Check = (prev, next, context) => {
    const {checker} = context;
    // We need a multiplication node containing a fraction
    if (prev.type !== "mul" || prev.args.every((arg) => arg.type !== "div")) {
        return FAILED_CHECK;
    }

    // We have another check method to handle a * 1/b
    if (prev.type === "mul" && prev.args.length === 2) {
        if (
            prev.args[0].type !== "div" &&
            prev.args[1].type === "div" &&
            exactMatch(prev.args[1].args[0], Semantic.number("1"), context)
        ) {
            return FAILED_CHECK;
        }
        // Handle 1/b * a as well since this can come up during factoring
        // and distribution of division.
        if (
            prev.args[0].type === "div" &&
            prev.args[1].type !== "div" &&
            exactMatch(prev.args[0].args[0], Semantic.number("1"), context)
        ) {
            return FAILED_CHECK;
        }
    }

    const numFactors: Semantic.Expression[] = [];
    const denFactors: Semantic.Expression[] = [];
    for (const arg of prev.args) {
        if (arg.type === "div") {
            const [numerator, denominator] = arg.args;
            numFactors.push(...Semantic.getFactors(numerator));
            denFactors.push(...Semantic.getFactors(denominator));
        } else {
            numFactors.push(...Semantic.getFactors(arg));
        }
    }
    const newPrev = Semantic.div(
        Semantic.mulFactors(numFactors, true),
        Semantic.mulFactors(denFactors, true),
    );
    const result = checker.checkStep(newPrev, next, context);
    if (result) {
        return {
            steps: [
                {
                    message: "multiplying fractions",
                    nodes: [prev, newPrev],
                },
                ...result.steps,
            ],
        };
    }

    return FAILED_CHECK;
};

mulByFrac.symmetric = true;
