import * as Semantic from "@math-blocks/semantic";

import {
    applySteps,
    decomposeFactors,
    difference,
    equality,
    intersection,
} from "./util";
import {Check} from "../types";

import {exactMatch} from "./basic-checks";

// TODO: Consider simplifying substeps for dividing integers.  Right now
// we do the following:
// 30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5
// There is precedent for this with evaluateMul, we could have evaluateDiv

export const checkDivisionCanceling: Check = (prev, next, context) => {
    if (prev.type !== "div") {
        return;
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
        return;
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

    return;
};

checkDivisionCanceling.symmetric = true;

// TODO: handle this in the same way we handle other symmetric checks
export const divByFrac: Check = (prev, next, context) => {
    const {checker} = context;
    if (prev.type !== "div") {
        return;
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

    return;
};

divByFrac.symmetric = true;

export const divBySame: Check = (prev, next, context) => {
    // a/a -> 1

    const {checker} = context;
    if (prev.type === "div") {
        const [numerator, denominator] = prev.args;
        const result1 = checker.checkStep(numerator, denominator, context);

        if (result1) {
            const newPrev = Semantic.number("1");
            const result2 = checker.checkStep(newPrev, next, context);

            if (result1 && result2) {
                return {
                    steps: context.reversed
                        ? [
                              ...result2.steps,
                              {
                                  message: "division by the same value",
                                  nodes: [
                                      newPrev,
                                      applySteps(prev, result1.steps),
                                  ],
                              },
                              ...result1.steps,
                          ]
                        : [
                              ...result1.steps,
                              {
                                  message: "division by the same value",
                                  nodes: [
                                      applySteps(prev, result1.steps),
                                      newPrev,
                                  ],
                              },
                              ...result2.steps,
                          ],
                };
            }
        }
    }

    return;
};

divBySame.symmetric = true;

export const divIsMulByOneOver: Check = (prev, next, context) => {
    const {checker} = context;

    // if (argsSet.has(prev) || argsSet.has(next)) {
    //     return
    // }

    // a/b -> a * 1/b, omit a/1 -> a * 1/1... acutally maybe we can get rid of divByOne
    //
    // why is a / 1 -> a?
    // a * 1/1 by definition of division and 1/1 = 1 because of inverses

    // TODO: check if the div is a child of a mul node... if we are then we'll
    // want the args of the mul node we create to be injected into the parent's
    // args.  We need tests for this.
    if (
        prev.type === "div" &&
        !exactMatch(prev.args[0], Semantic.number("1"), context)
    ) {
        const [numerator, denominator] = prev.args;
        const newPrev = Semantic.mul([
            numerator,
            Semantic.div(Semantic.number("1"), denominator),
        ]);

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return {
                steps: context.reversed
                    ? [
                          ...result.steps,
                          {
                              message:
                                  "multiplying by one over something results in a fraction",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message:
                                  "fraction is the same as multiplying by one over",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    if (prev.type === "mul") {
        const divIndex = prev.args.findIndex(
            (arg) =>
                arg.type === "div" &&
                !exactMatch(arg.args[0], Semantic.number("1"), context),
        );

        const div = prev.args[divIndex];

        if (div && div.type === "div") {
            const [numerator, denominator] = div.args;

            const newFactor = Semantic.mul([
                numerator,
                Semantic.div(Semantic.number("1"), denominator),
            ]);

            const newPrev = Semantic.mul(
                [
                    ...prev.args.slice(0, divIndex),
                    ...newFactor.args,
                    ...prev.args.slice(divIndex + 1),
                ] as TwoOrMore<Semantic.Expression>,
                prev.implicit,
            );

            const result = checker.checkStep(newPrev, next, context);

            if (result) {
                return {
                    steps: context.reversed
                        ? [
                              ...result.steps,
                              {
                                  message:
                                      "multiplying by one over something results in a fraction",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "fraction is the same as multiplying by one over",
                                  nodes: [prev, newPrev],
                              },
                              ...result.steps,
                          ],
                };
            }
        }
    }

    return;
};

divIsMulByOneOver.symmetric = true;

export const mulByFrac: Check = (prev, next, context) => {
    const {checker} = context;
    // We need a multiplication node containing a fraction
    if (prev.type !== "mul" || prev.args.every((arg) => arg.type !== "div")) {
        return;
    }

    // TODO: handle more than two args
    if (prev.type === "mul" && prev.args.length === 2) {
        // We have another check method to handle a * 1/b
        if (
            prev.args[0].type !== "div" &&
            prev.args[1].type === "div" &&
            exactMatch(prev.args[1].args[0], Semantic.number("1"), context)
        ) {
            return;
        }
        // Handle 1/b * a as well since this can come up during factoring
        // and distribution of division.
        if (
            prev.args[0].type === "div" &&
            prev.args[1].type !== "div" &&
            exactMatch(prev.args[0].args[0], Semantic.number("1"), context)
        ) {
            return;
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
        Semantic.mulFactors(denFactors, true), // denFactors = [] -> 1
    );
    const result = checker.checkStep(newPrev, next, context);
    if (result) {
        return {
            steps: context.reversed
                ? [
                      ...result.steps,
                      {
                          message: "multiplying fractions",
                          nodes: [newPrev, prev],
                      },
                  ]
                : [
                      {
                          message: "multiplying fractions",
                          nodes: [prev, newPrev],
                      },
                      ...result.steps,
                  ],
        };
    }

    return;
};

mulByFrac.symmetric = true;
