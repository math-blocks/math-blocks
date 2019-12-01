// @flow
import * as Arithmetic from "./arithmetic.js";
import * as Semantic from "../semantic.js";
import type {IStepChecker, Result} from "./step-checker.js";

import {decomposeFactors} from "./util.js";

class FractionChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkDivisionCanceling(
        a: Semantic.Expression,
        b: Semantic.Expression,
    ): Result {
        if (a.type !== "div") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        const {checker} = this;
        const [numeratorA, denominatorA] = a.args;
        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsA = Arithmetic.getFactors(numeratorA);
        const denFactorsA = Arithmetic.getFactors(denominatorA);

        // cases:
        // - ab/ac -> a/a * b/c
        // - ab/a -> a/1 -> a
        const [numeratorB, denominatorB] =
            b.type === "div" ? b.args : [b, Arithmetic.ONE];

        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsB = Arithmetic.getFactors(numeratorB);
        const denFactorsB = Arithmetic.getFactors(denominatorB);

        // Ensure that no extra factors were added to either the numerator
        // or denominator.  It's okay to ignore factors that ONE since multiplying
        // by 1 doesn't affect the value of the numerator or denominator.
        const addedNumFactors = checker.difference(numFactorsB, numFactorsA);
        const addedDenFactors = checker.difference(denFactorsB, denFactorsA);

        if (
            !checker.checkStep(Arithmetic.mul(addedNumFactors), Arithmetic.ONE)
                .equivalent ||
            !checker.checkStep(Arithmetic.mul(addedDenFactors), Arithmetic.ONE)
                .equivalent
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
                const newPrev = Arithmetic.div(
                    Arithmetic.mul(factoredNumFactorsA),
                    Arithmetic.mul(factoredDenFactorsA),
                );
                const newNext = Arithmetic.div(
                    Arithmetic.mul(factoredNumFactorsB),
                    Arithmetic.mul(factoredDenFactorsB),
                );

                // TODO: allow `nodes` in Reason type to have more than two nodes
                // to handle cases where we modify both prev and next to work the
                // problem from both sides essentially.
                const result1 = this.checkDivisionCanceling(newPrev, newNext);

                // Because we're also creating a new step coming from the opposite
                // direction, we need to check that that step will also work.
                const result2 = checker.checkStep(newNext, b);

                if (result1.equivalent && result2.equivalent) {
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message: "prime factorization",
                                nodes: [],
                            },
                            ...result1.reasons,
                            ...result2.reasons,
                        ],
                    };
                }
            }

            // TODO: Add reason for why the canceling check failed
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: figure out how to handle duplicate factors
        const removedNumFactors = checker.difference(numFactorsA, numFactorsB);
        const remainingNumFactors = checker.intersection(
            numFactorsA,
            numFactorsB,
        );
        const removedDenFactors = checker.difference(denFactorsA, denFactorsB);
        const remainingDenFactors = checker.intersection(
            denFactorsA,
            denFactorsB,
        );

        if (remainingNumFactors.length === 0) {
            remainingNumFactors.push(Arithmetic.ONE);
        }

        if (remainingDenFactors.length === 0) {
            remainingDenFactors.push(Arithmetic.ONE);
        }

        // ab/ac -> a/a * b/c
        if (
            removedNumFactors.length > 0 &&
            removedNumFactors.length === removedDenFactors.length &&
            checker.equality(removedNumFactors, removedDenFactors)
        ) {
            const productA = Arithmetic.mul([
                Arithmetic.div(
                    Arithmetic.mul(removedNumFactors),
                    Arithmetic.mul(removedDenFactors),
                ),
                Arithmetic.div(
                    Arithmetic.mul(remainingNumFactors),
                    Arithmetic.mul(remainingDenFactors),
                ),
            ]);

            const {equivalent, reasons} = checker.checkStep(productA, b);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message:
                                "extract common factors from numerator and denominator",
                            nodes: [],
                        },
                        ...reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    divByFrac(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        if (prev.type !== "div") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const [numerator, denominator] = prev.args;

        if (denominator.type === "div") {
            const reciprocal = Arithmetic.div(
                denominator.args[1],
                denominator.args[0],
            );
            const newPrev = Arithmetic.mul([numerator, reciprocal]);
            const result = checker.checkStep(newPrev, next);

            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message:
                                "dividing by a fraction is the same as multiplying by the reciprocal",
                            nodes: [],
                        },
                        ...result.reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    divByOne(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        if (
            prev.type === "div" &&
            checker.checkStep(prev.args[1], Arithmetic.ONE).equivalent
        ) {
            const {equivalent, reasons} = checker.checkStep(prev.args[0], next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "division by one",
                            nodes: [],
                        },
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    divBySame(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        if (prev.type === "div") {
            const [numerator, denominator] = prev.args;
            const result1 = checker.checkStep(numerator, denominator);
            const result2 = checker.checkStep(next, Arithmetic.ONE);
            if (result1.equivalent && result2.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...result1.reasons,
                        {
                            message: "division by the same value",
                            nodes: [],
                        },
                        ...result2.reasons,
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    mulByFrac(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        // We need a multiplication node containing a fraction
        if (prev.type !== "mul" || prev.args.every(arg => arg.type !== "div")) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const numFactors = [];
        const denFactors = [];
        for (const arg of prev.args) {
            if (arg.type === "div") {
                const [numerator, denominator] = arg.args;
                numFactors.push(...Arithmetic.getFactors(numerator));
                denFactors.push(...Arithmetic.getFactors(denominator));
            } else {
                numFactors.push(...Arithmetic.getFactors(arg));
            }
        }
        const newPrev = Arithmetic.div(
            Arithmetic.mul(numFactors),
            Arithmetic.mul(denFactors),
        );
        const {equivalent, reasons} = checker.checkStep(newPrev, next);
        return {
            equivalent,
            reasons: equivalent
                ? [
                      {
                          message: "multiplying fractions",
                          nodes: [],
                      },
                      ...reasons,
                  ]
                : [],
        };
    }

    checkStep(prev: Semantic.Expression, next: Semantic.Expression): Result {
        let result;

        result = this.divByFrac(prev, next);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.divByFrac(next, prev);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(next, prev);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(next, prev);
        if (result.equivalent) {
            return result;
        }

        // a * b/c -> ab / c
        result = this.mulByFrac(prev, next);
        if (result.equivalent) {
            return result;
        }

        // ab / c -> a * b/c
        result = this.mulByFrac(next, prev);
        if (result.equivalent) {
            return result;
        }

        // relies on divByOne being called first
        // TODO: figure out a way to avoid the need for specific ordering
        result = this.checkDivisionCanceling(prev, next);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.checkDivisionCanceling(next, prev);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default FractionChecker;
