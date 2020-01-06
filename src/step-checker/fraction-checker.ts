import * as Arithmetic from "./arithmetic";
import * as Semantic from "../semantic/semantic";
import {IStepChecker, Result, Reason} from "./step-checker";

import {decomposeFactors} from "./util";

// TODO: Consider simplifying substeps for dividing integers.  Right now
// we do the following:
// 30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5
// There is precedent for this with evaluateMul, we could have evaluateDiv

class FractionChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkDivisionCanceling(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: Reason[],
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
        const addedNumFactors = checker.difference(
            numFactorsB,
            numFactorsA,
            reasons,
        );
        const addedDenFactors = checker.difference(
            denFactorsB,
            denFactorsA,
            reasons,
        );

        if (
            !checker.checkStep(
                Arithmetic.mul(addedNumFactors),
                Arithmetic.ONE,
                reasons,
            ).equivalent ||
            !checker.checkStep(
                Arithmetic.mul(addedDenFactors),
                Arithmetic.ONE,
                reasons,
            ).equivalent
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
                const result1 = this.checkDivisionCanceling(
                    newPrev,
                    newNext,
                    reasons,
                );

                // Because we're also creating a new step coming from the opposite
                // direction, we need to check that that step will also work.
                const result2 = checker.checkStep(newNext, b, reasons);

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
        const removedNumFactors = checker.difference(
            numFactorsA,
            numFactorsB,
            reasons,
        );
        const remainingNumFactors = checker.intersection(
            numFactorsA,
            numFactorsB,
            reasons,
        );
        const removedDenFactors = checker.difference(
            denFactorsA,
            denFactorsB,
            reasons,
        );
        const remainingDenFactors = checker.intersection(
            denFactorsA,
            denFactorsB,
            reasons,
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
            checker.equality(removedNumFactors, removedDenFactors, reasons)
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

            const result = checker.checkStep(productA, b, reasons);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message:
                                "extract common factors from numerator and denominator",
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

    divByFrac(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
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
            const result = checker.checkStep(newPrev, next, reasons);

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

    divByOne(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        const {checker} = this;
        if (
            prev.type === "div" &&
            checker.checkStep(prev.args[1], Arithmetic.ONE, reasons).equivalent
        ) {
            const result = checker.checkStep(prev.args[0], next, reasons);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...result.reasons,
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

    divBySame(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        const {checker} = this;
        if (prev.type === "div") {
            const [numerator, denominator] = prev.args;
            const result1 = checker.checkStep(numerator, denominator, reasons);
            const result2 = checker.checkStep(next, Arithmetic.ONE, reasons);
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

    divIsMulByOneOver(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        reasons: Reason[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        // We found a cycle so let's abort
        if (reasons.length > 0) {
            if (
                reasons[0].message ===
                    "multiplying by one over something results in a fraction" ||
                reasons[0].message ===
                    "fraction is the same as multiplying by one over"
            ) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
        }

        // TODO: check if the div is a child of a mul node
        if (
            prev.type === "div" &&
            !checker.exactMatch(prev.args[0], Arithmetic.ONE).equivalent
        ) {
            const newPrev = Arithmetic.mul([
                prev.args[0],
                Arithmetic.div(Arithmetic.ONE, prev.args[1]),
            ]);

            const reason = {
                message: reverse
                    ? "multiplying by one over something results in a fraction"
                    : "fraction is the same as multiplying by one over",
                nodes: [prev, newPrev],
            };

            const result = reverse
                ? checker.checkStep(next, newPrev, [reason, ...reasons])
                : checker.checkStep(newPrev, next, [reason, ...reasons]);

            const newReasons = reverse
                ? [...result.reasons, reason]
                : [reason, ...result.reasons];

            return {
                equivalent: result.equivalent,
                reasons: result.equivalent ? newReasons : [],
            };
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    mulByFrac(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        const {checker} = this;
        // We need a multiplication node containing a fraction
        if (prev.type !== "mul" || prev.args.every(arg => arg.type !== "div")) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // We have another check method to handle a * 1/b
        if (prev.type === "mul" && prev.args.length === 2) {
            if (
                prev.args[0].type !== "div" &&
                prev.args[1].type === "div" &&
                checker.exactMatch(prev.args[1].args[0], Arithmetic.ONE)
            ) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            // Handle 1/b * a as well since this can come up during factoring
            // and distribution of division.
            if (
                prev.args[0].type === "div" &&
                prev.args[1].type !== "div" &&
                checker.exactMatch(prev.args[0].args[0], Arithmetic.ONE)
            ) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
        }

        const numFactors: Semantic.Expression[] = [];
        const denFactors: Semantic.Expression[] = [];
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
        const result = checker.checkStep(newPrev, next, reasons);
        return {
            equivalent: result.equivalent,
            reasons: result.equivalent
                ? [
                      {
                          message: "multiplying fractions",
                          nodes: [prev, newPrev],
                      },
                      ...result.reasons,
                  ]
                : [],
        };
    }

    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        let result: Result;

        result = this.divByFrac(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.divByFrac(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        // a * b/c -> ab / c
        result = this.mulByFrac(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        // ab / c -> a * b/c
        result = this.mulByFrac(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divIsMulByOneOver(prev, next, false, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.divIsMulByOneOver(prev, next, true, reasons);
        if (result.equivalent) {
            return result;
        }

        // relies on divByOne being called first
        // TODO: figure out a way to avoid the need for specific ordering
        result = this.checkDivisionCanceling(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.checkDivisionCanceling(next, prev, reasons);
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
