import * as Semantic from "@math-blocks/semantic";

import {Result, Check} from "../types";
import {FAILED_CHECK} from "../constants";

export const addInverse: Check = (prev, next, context, reverse) => {
    const {checker} = context;

    if (prev.type !== "add") {
        return FAILED_CHECK;
    }

    const indicesToRemove = new Set();
    const terms = Semantic.getTerms(prev);

    // TODO: extract this code into a helper so that we can test it better
    for (let i = 0; i < terms.length; i++) {
        for (let j = 0; j < terms.length; j++) {
            if (i === j) {
                continue;
            }
            const a = terms[i];
            const b = terms[j];
            // TODO: add a sub-step in the subtraction case
            if (Semantic.isNegative(b) || Semantic.isSubtraction(b)) {
                const result = checker.checkStep(a, b.arg, context);
                if (
                    result &&
                    // Avoid removing a term that matches a term that's
                    // already been removed.
                    (!indicesToRemove.has(j) || !indicesToRemove.has(j))
                ) {
                    // TODO: capture the reasons and include them down below
                    indicesToRemove.add(i);
                    indicesToRemove.add(j);
                }
            }
        }
    }
    if (indicesToRemove.size > 0) {
        const newPrev = Semantic.addTerms(
            terms.filter(
                (term: Semantic.Expression, index: number) =>
                    !indicesToRemove.has(index),
            ),
        );
        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);

        if (result) {
            return {
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message: "adding inverse",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message: "adding inverse",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

addInverse.symmetric = true;

export const doubleNegative: Check = (prev, next, context, reverse) => {
    const {checker} = context;

    if (Semantic.isNegative(prev) && Semantic.isNegative(prev.arg)) {
        const newPrev = prev.arg.arg;
        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);
        if (result) {
            return {
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message: "negative of a negative is positive",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message: "negative of a negative is positive",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

doubleNegative.symmetric = true;

export const subIsNeg: Check = (prev, next, context, reverse) => {
    const {checker} = context;
    const results: Result[] = [];

    if (prev.type === "add" && next.type === "add") {
        const subs: Semantic.Neg[] = prev.args.filter(Semantic.isSubtraction);

        // We iterate through all args that are subtraction and compute
        // their result so that we can pick the shortest set of steps below.
        for (const sub of subs) {
            const index = prev.args.indexOf(sub);
            const neg =
                sub.arg.type === "mul"
                    ? Semantic.mul([
                          Semantic.neg(sub.arg.args[0]),
                          ...sub.arg.args.slice(1),
                      ] as TwoOrMore<Semantic.Expression>)
                    : Semantic.neg(sub.arg);

            const newPrev = Semantic.addTerms([
                ...prev.args.slice(0, index),
                neg,
                ...prev.args.slice(index + 1),
            ]);

            const result = reverse
                ? checker.checkStep(next, newPrev, context)
                : checker.checkStep(newPrev, next, context);
            if (result) {
                results.push({
                    steps: reverse
                        ? [
                              ...result.steps,
                              {
                                  message:
                                      "subtracting is the same as adding the inverse",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "subtracting is the same as adding the inverse",
                                  nodes: [prev, newPrev],
                              },
                              ...result.steps,
                          ],
                });
            }
        }
    }

    // If there are multiple results, pick the one with the shortest number
    // of steps.
    if (results.length > 0) {
        let shortestResult = results[0];
        for (const result of results.slice(1)) {
            if (result.steps.length < shortestResult.steps.length) {
                shortestResult = result;
            }
        }
        return shortestResult;
    }

    return FAILED_CHECK;
};

subIsNeg.symmetric = true;

export const negIsMulNegOne: Check = (prev, next, context, reverse) => {
    const {checker} = context;

    if (
        prev.type === "neg" &&
        !prev.subtraction &&
        // exclude -1 to avoid an infinite expansion
        !(prev.arg.type == "number" && prev.arg.value == "1")
    ) {
        const newPrev = Semantic.mulFactors([
            Semantic.neg(Semantic.number("1")),
            ...Semantic.getFactors(prev.arg),
        ]);

        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);
        if (result) {
            return {
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message:
                                  "negation is the same as multipling by negative one",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message:
                                  "negation is the same as multipling by negative one",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

negIsMulNegOne.symmetric = true;

export const mulTwoNegsIsPos: Check = (prev, next, context, reverse) => {
    const {checker} = context;

    if (prev.type === "mul" && next.type === "mul") {
        const factors: TwoOrMore<Semantic.Expression> = [...prev.args];

        const negIndices: number[] = [];

        for (let i = 0; i < factors.length; i++) {
            const factor = factors[i];
            if (factor.type === "neg") {
                negIndices.push(i);
            }
        }

        if (negIndices.length >= 2) {
            // remove each pair of negatives
            for (let i = 0; i < negIndices.length; i += 2) {
                const neg1 = factors[negIndices[i]];
                const neg2 = factors[negIndices[i + 1]];
                if (neg1.type === "neg" && neg2.type === "neg") {
                    factors[negIndices[i]] = neg1.arg;
                    factors[negIndices[i + 1]] = neg2.arg;
                }
            }
        } else {
            return FAILED_CHECK;
        }

        const newPrev = Semantic.mul(factors);

        const result = reverse
            ? checker.checkStep(next, newPrev, context)
            : checker.checkStep(newPrev, next, context);

        if (result) {
            return {
                steps: reverse
                    ? [
                          ...result.steps,
                          {
                              message:
                                  "a positive is the same as multiplying two negatives",
                              nodes: [newPrev, prev],
                          },
                      ]
                    : [
                          {
                              message:
                                  "multiplying two negatives is a positive",
                              nodes: [prev, newPrev],
                          },
                          ...result.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

mulTwoNegsIsPos.symmetric = true;

/**
 * This is kind of a weird rule in that it's not normally something that people
 * would show when working through steps manually.  It's necessary though to
 * handle distribution involving negatives.
 *
 * example: (x)(-y) -> -xy
 *
 * A more detailed version of this would be:
 * (x)(-y) -> (x)(-1)(y) -> (-1)(x)(y) -> -xy
 *
 * @param prev
 * @param next
 * @param context
 */
export const moveNegToFirstFactor: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === "mul" && prev.args[0].type !== "neg") {
        const factors: TwoOrMore<Semantic.Expression> = [...prev.args];
        const index = factors.findIndex((factor) => factor.type === "neg");
        const neg = factors[index];

        if (index !== -1 && neg.type === "neg") {
            factors[0] = Semantic.neg(factors[0]);
            factors[index] = neg.arg;
        } else {
            // If there are no negatives then we can't transfer a negative
            return FAILED_CHECK;
        }

        const newPrev = Semantic.mul(factors);
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return {
                steps: [
                    {
                        message: "move negative to first factor",
                        nodes: [prev, newPrev],
                    },
                    ...result.steps,
                ],
            };
        }
    }

    return FAILED_CHECK;
};
