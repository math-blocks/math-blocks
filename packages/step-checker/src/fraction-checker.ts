import * as Semantic from "@math-blocks/semantic";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";
import {decomposeFactors, applySubReasons} from "./util";

// TODO: Consider simplifying substeps for dividing integers.  Right now
// we do the following:
// 30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5
// There is precedent for this with evaluateMul, we could have evaluateDiv

class FractionChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkDivisionCanceling(a: Semantic.Expression, b: Semantic.Expression, steps: Step[]): Result {
        if (a.type !== "div") {
            return {
                equivalent: false,
                steps: [],
            };
        }
        const {checker} = this;
        const [numeratorA, denominatorA] = a.args;
        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsA = Semantic.getFactors(numeratorA);
        const denFactorsA = Semantic.getFactors(denominatorA);

        // cases:
        // - ab/ac -> a/a * b/c
        // - ab/a -> a/1 -> a
        const [numeratorB, denominatorB] = b.type === "div" ? b.args : [b, Semantic.number("1")];

        numeratorA; // ?
        numeratorB; // ?

        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsB = Semantic.getFactors(numeratorB);
        const denFactorsB = Semantic.getFactors(denominatorB);

        // Ensure that no extra factors were added to either the numerator
        // or denominator.  It's okay to ignore factors that ONE since multiplying
        // by 1 doesn't affect the value of the numerator or denominator.
        const addedNumFactors = checker.difference(numFactorsB, numFactorsA, steps);
        const addedDenFactors = checker.difference(denFactorsB, denFactorsA, steps);

        if (
            !checker.checkStep(Semantic.mulFactors(addedNumFactors), Semantic.number("1"), steps)
                .equivalent ||
            !checker.checkStep(Semantic.mulFactors(addedDenFactors), Semantic.number("1"), steps)
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
                const result1 = this.checkDivisionCanceling(newPrev, newNext, steps);
                a; // ?
                b; // ?
                newPrev.args[0]; // ?
                newPrev.args[1]; // ?
                newNext.args[0]; // ?
                newNext.args[1]; // ?

                // Because we're also creating a new step coming from the opposite
                // direction, we need to check that that step will also work.
                const result2 = checker.checkStep(newNext, b, steps);

                result2.equivalent; //?
                result1.equivalent; //?

                if (result1.equivalent && result2.equivalent) {
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message: "prime factorization",
                                nodes: [a, newPrev],
                            },
                            ...result1.steps,
                            ...result2.steps,
                        ],
                    };
                }
            }

            // TODO: Add reason for why the canceling check failed
            return {
                equivalent: false,
                steps: [],
            };
        }

        // TODO: figure out how to handle duplicate factors
        const removedNumFactors = checker.difference(numFactorsA, numFactorsB, steps);
        const remainingNumFactors = checker.intersection(numFactorsA, numFactorsB, steps);
        const removedDenFactors = checker.difference(denFactorsA, denFactorsB, steps);
        const remainingDenFactors = checker.intersection(denFactorsA, denFactorsB, steps);

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
            checker.equality(removedNumFactors, removedDenFactors, steps)
        ) {
            const productA = Semantic.mulFactors([
                Semantic.div(
                    Semantic.mulFactors(removedNumFactors),
                    Semantic.mulFactors(removedDenFactors),
                ),
                Semantic.div(
                    Semantic.mulFactors(remainingNumFactors),
                    Semantic.mulFactors(remainingDenFactors),
                ),
            ]);

            const result = checker.checkStep(productA, b, steps);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    steps: [
                        {
                            message: "extract common factors from numerator and denominator",
                            nodes: [a, productA],
                        },
                        ...result.steps,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            steps: [],
        };
    }

    divByFrac(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        const {checker} = this;
        if (prev.type !== "div") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        const [numerator, denominator] = prev.args;

        if (denominator.type === "div") {
            const reciprocal = Semantic.div(denominator.args[1], denominator.args[0]);
            const newPrev = Semantic.mulFactors([numerator, reciprocal]);
            const result = checker.checkStep(newPrev, next, steps);

            if (result.equivalent) {
                return {
                    equivalent: true,
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

        return {
            equivalent: false,
            steps: [],
        };
    }

    divByOne(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        const {checker} = this;
        if (
            prev.type === "div" &&
            checker.checkStep(prev.args[1], Semantic.number("1"), steps).equivalent
        ) {
            const result = checker.checkStep(prev.args[0], next, steps);
            const newPrev = applySubReasons(prev, result.steps);
            if (result.equivalent) {
                return {
                    equivalent: true,
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
        return {
            equivalent: false,
            steps: [],
        };
    }

    divBySame(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        const {checker} = this;
        if (prev.type === "div") {
            const [numerator, denominator] = prev.args;
            const one = Semantic.number("1");
            const result1 = checker.checkStep(numerator, denominator, steps);
            const result2 = checker.checkStep(next, Semantic.number("1"), steps);
            if (result1.equivalent && result2.equivalent) {
                return {
                    equivalent: true,
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
        return {
            equivalent: false,
            steps: [],
        };
    }

    divIsMulByOneOver(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        // We found a cycle so let's abort
        if (steps.length > 0) {
            if (
                steps[0].message === "multiplying by one over something results in a fraction" ||
                steps[0].message === "fraction is the same as multiplying by one over"
            ) {
                return {
                    equivalent: false,
                    steps: [],
                };
            }
        }

        // TODO: check if the div is a child of a mul node
        if (
            prev.type === "div" &&
            !checker.exactMatch(prev.args[0], Semantic.number("1")).equivalent
        ) {
            const newPrev = Semantic.mulFactors([
                prev.args[0],
                Semantic.div(Semantic.number("1"), prev.args[1]),
            ]);

            // TODO: write more tests to check that all of this is correct
            const step = {
                message: reverse
                    ? "multiplying by one over something results in a fraction"
                    : "fraction is the same as multiplying by one over",
                nodes: reverse ? [newPrev, prev] : [prev, newPrev],
            };

            const result = reverse
                ? checker.checkStep(next, newPrev, [step, ...steps])
                : checker.checkStep(newPrev, next, [step, ...steps]);

            const newReasons = reverse ? [...result.steps, step] : [step, ...result.steps];

            return {
                equivalent: result.equivalent,
                steps: result.equivalent ? newReasons : [],
            };
        }
        return {
            equivalent: false,
            steps: [],
        };
    }

    mulByFrac(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        const {checker} = this;
        // We need a multiplication node containing a fraction
        if (prev.type !== "mul" || prev.args.every((arg) => arg.type !== "div")) {
            return {
                equivalent: false,
                steps: [],
            };
        }

        // We have another check method to handle a * 1/b
        if (prev.type === "mul" && prev.args.length === 2) {
            if (
                prev.args[0].type !== "div" &&
                prev.args[1].type === "div" &&
                checker.exactMatch(prev.args[1].args[0], Semantic.number("1")).equivalent
            ) {
                return {
                    equivalent: false,
                    steps: [],
                };
            }
            // Handle 1/b * a as well since this can come up during factoring
            // and distribution of division.
            if (
                prev.args[0].type === "div" &&
                prev.args[1].type !== "div" &&
                checker.exactMatch(prev.args[0].args[0], Semantic.number("1"))
            ) {
                return {
                    equivalent: false,
                    steps: [],
                };
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
            Semantic.mulFactors(numFactors),
            Semantic.mulFactors(denFactors),
        );
        const result = checker.checkStep(newPrev, next, steps);
        return {
            equivalent: result.equivalent,
            steps: result.equivalent
                ? [
                      {
                          message: "multiplying fractions",
                          nodes: [prev, newPrev],
                      },
                      ...result.steps,
                  ]
                : [],
        };
    }

    runChecks(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        let result: Result;

        result = this.divByFrac(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.divByFrac(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        // a * b/c -> ab / c
        result = this.mulByFrac(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        // ab / c -> a * b/c
        result = this.mulByFrac(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divIsMulByOneOver(prev, next, false, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.divIsMulByOneOver(prev, next, true, steps);
        if (result.equivalent) {
            return result;
        }

        // relies on divByOne being called first
        // TODO: figure out a way to avoid the need for specific ordering
        result = this.checkDivisionCanceling(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        // TODO: add a test case for this
        result = this.checkDivisionCanceling(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default FractionChecker;
