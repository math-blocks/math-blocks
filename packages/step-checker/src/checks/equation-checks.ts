import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";
import {FAILED_CHECK} from "../constants";
import {difference} from "../util";

// TODO: create sub-steps that includes the opposite operation when reversed is true
// TODO: include which nodes were added/removed in each reason
// TODO: handle square rooting both sides
// TODO: handle applying the same exponent to both sides

const NUMERATOR = 0;
const DENOMINATOR = 1;

export const checkAddSub: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return FAILED_CHECK;
    }

    const {checker} = context;

    const [lhsA, rhsA] = prev.args;
    const [lhsB, rhsB] = next.args;

    if (lhsB.type === "add" && rhsB.type === "add") {
        const lhsNewTerms = difference(
            Semantic.getTerms(lhsB),
            Semantic.getTerms(lhsA),
            context,
        );
        const rhsNewTerms = difference(
            Semantic.getTerms(rhsB),
            Semantic.getTerms(rhsA),
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
            return FAILED_CHECK;
        }

        if (lhsNewTerms.length === 0 || rhsNewTerms.length === 0) {
            // TODO: write a test for this
            return FAILED_CHECK;
        }

        const newPrev = Semantic.eq([
            Semantic.add([
                ...Semantic.getTerms(lhsA),
                ...lhsNewTerms,
            ] as TwoOrMore<Semantic.Expression>),
            Semantic.add([
                ...Semantic.getTerms(rhsA),
                ...rhsNewTerms,
            ] as TwoOrMore<Semantic.Expression>),
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

        // Using applySteps with result.steps won't work because we're not
        // passing in either prev or next, we're creating temporary multiplication
        // nodes.
        // TODO: create a newPrev node

        if (result1 && result2) {
            return {
                steps: context.reversed
                    ? [
                          ...result1.steps,
                          ...result2.steps,
                          {
                              message:
                                  "removing adding the same value to both sides",
                              nodes: [next, prev],
                          },
                      ]
                    : [
                          {
                              message: "adding the same value to both sides",
                              nodes: [prev, next],
                          },
                          ...result2.steps,
                          ...result1.steps,
                      ],
            };
        }
    }

    return FAILED_CHECK;
};

checkAddSub.symmetric = true;

export const checkMul: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return FAILED_CHECK;
    }

    const {checker} = context;

    const [lhsA, rhsA] = prev.args;
    const [lhsB, rhsB] = next.args;

    if (lhsB.type === "mul" && rhsB.type === "mul") {
        const lhsNewFactors = difference(
            Semantic.getFactors(lhsB),
            Semantic.getFactors(lhsA),
            context,
        );
        const rhsNewFactors = difference(
            Semantic.getFactors(rhsB),
            Semantic.getFactors(rhsA),
            context,
        );
        const result1 = checker.checkStep(
            Semantic.mulFactors(lhsNewFactors),
            Semantic.mulFactors(rhsNewFactors),
            context,
        );

        const newPrev = Semantic.eq([
            Semantic.mul([
                ...Semantic.getFactors(lhsA),
                ...lhsNewFactors,
            ] as TwoOrMore<Semantic.Expression>),
            Semantic.mul([
                ...Semantic.getFactors(rhsA),
                ...rhsNewFactors,
            ] as TwoOrMore<Semantic.Expression>),
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

        // Using applySteps with result.steps won't work because we're not
        // passing in either prev or next, we're creating temporary multiplication
        // nodes.
        // TODO: create a newPrev node

        if (result1 && result2) {
            return {
                steps: context.reversed
                    ? [
                          ...result1.steps,
                          ...result2.steps,
                          {
                              message: "remove multiplication from both sides",
                              nodes: [next, prev],
                          },
                      ]
                    : [
                          {
                              message: "multiply both sides by the same value",
                              nodes: [prev, next],
                          },
                          ...result2.steps,
                          ...result1.steps,
                      ],
            };
        }
    }
    return FAILED_CHECK;
};

checkMul.symmetric = true;

export const checkDiv: Check = (prev, next, context) => {
    if (prev.type !== "eq" || next.type !== "eq") {
        return FAILED_CHECK;
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
                return {
                    steps: context.reversed
                        ? [
                              {
                                  message: "remove division by the same amount",
                                  nodes: [next, prev],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "divide both sides by the same value",
                                  nodes: [prev, next],
                              },
                          ],
                };
            } else {
                // TODO: custom error message for this case
            }
        }
    }

    return FAILED_CHECK;
};

checkDiv.symmetric = true;
