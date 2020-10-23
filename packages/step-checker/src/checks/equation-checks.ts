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

export const checkAddSub: Check = (prev, next, context, reversed) => {
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
        // TODO: check thata lhsNew and rhsNew has a single term
        const lhsNew = Semantic.addTerms(lhsNewTerms);
        const rhsNew = Semantic.addTerms(rhsNewTerms);
        const result = checker.checkStep(lhsNew, rhsNew, context);

        const lhsNewTerm = lhsNewTerms[0];
        const rhsNewTerm = rhsNewTerms[0];

        if (!lhsNewTerm || !rhsNewTerm) {
            // TODO: write a test for this
            // 2x + 5 = 10
            // 2x + 5 - 5 = 10 - 5
            // 2x + 5 - 5 = 5 ---> this used cause an error with thiis check
            return FAILED_CHECK;
        }

        if (reversed) {
            // This check prevents an infinite loop
            if (
                context.steps.some(
                    (step) =>
                        step.message ===
                        "removing the same term from both sides",
                )
            ) {
                return FAILED_CHECK;
            }

            const newPrev = Semantic.eq([
                // @ts-ignore: array destructuring converts OneOrMore<T> to T[]
                Semantic.add([
                    ...Semantic.getTerms(lhsB),
                    lhsNewTerm.type === "neg"
                        ? lhsNewTerm.arg
                        : Semantic.neg(lhsNewTerm, true),
                ]),
                // @ts-ignore: array destructuring converts OneOrMore<T> to T[]
                Semantic.add([
                    ...Semantic.getTerms(rhsB),
                    rhsNewTerm.type === "neg"
                        ? rhsNewTerm.arg
                        : Semantic.neg(rhsNewTerm, true),
                ]),
            ]);
            newPrev;

            const newSteps = [
                ...context.steps,
                {
                    message: "removing the same term from both sides",
                    // TODO: add nodes
                    nodes: [],
                },
            ];

            const result = checker.checkStep(newPrev, prev, {
                ...context,
                steps: newSteps,
            });
            if (result) {
                return {
                    equivalent: true,
                    steps: [
                        {
                            message: "subtract the same value from both sides",
                            nodes: [next, newPrev],
                        },
                        ...result.steps,
                    ],
                };
            } else {
                // TODO: write test for this case
                return FAILED_CHECK;
            }
        }

        // TODO: handle adding multiple things to lhs and rhs as the same time
        // TODO: do we want to enforce that the thing being added is exactly
        // the same or do we want to allow equivalent expressions?
        if (result && result.steps.length === 0) {
            if (
                Semantic.isSubtraction(lhsNewTerms[0]) &&
                Semantic.isSubtraction(rhsNewTerms[0])
            ) {
                return {
                    equivalent: true,
                    steps: [
                        {
                            message:
                                "subtracting the same value from both sides",
                            // TODO: add nodes
                            nodes: [],
                        },
                    ],
                };
            }
            return {
                equivalent: true,
                steps: [
                    {
                        message: "adding the same value to both sides",
                        // TODO: add nodes
                        nodes: [],
                    },
                ],
            };
        }
    }
    return FAILED_CHECK;
};

checkAddSub.symmetric = true;

export const checkMul: Check = (prev, next, context, reversed) => {
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
        const result = checker.checkStep(
            Semantic.mulFactors(lhsNewFactors),
            Semantic.mulFactors(rhsNewFactors),
            context,
        );

        if (reversed) {
            if (
                context.steps.some(
                    (step) =>
                        step.message === "remove common factor on both sides",
                )
            ) {
                // prevent infinite loop
                // TODO: determine if this is still needed
                return FAILED_CHECK;
            }

            const newPrev = Semantic.eq([
                Semantic.div(lhsB, Semantic.mulFactors(lhsNewFactors)),
                Semantic.div(rhsB, Semantic.mulFactors(rhsNewFactors)),
            ]);

            const newSteps = [
                ...context.steps,
                {
                    message: "remove common factor on both sides",
                    nodes: [],
                },
            ];

            const result = checker.checkStep(newPrev, prev, {
                ...context,
                steps: newSteps,
            });
            if (result) {
                return {
                    equivalent: true,
                    steps: [
                        {
                            message: "divide both sides by the same value",
                            nodes: [next, newPrev],
                        },
                        ...result.steps,
                    ],
                };
            } else {
                // TODO: write test for this case
                return FAILED_CHECK;
            }
        }

        // TODO: do we want to enforce that the thing being added is exactly
        // the same or do we want to allow equivalent expressions?
        if (result && result.steps.length === 0) {
            return {
                equivalent: true,
                steps: [
                    {
                        message: "multiply both sides by the same value",
                        nodes: [],
                    },
                ],
            };
        }
    }
    return FAILED_CHECK;
};

checkMul.symmetric = true;

export const checkDiv: Check = (prev, next, context, reversed) => {
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

            if (reversed) {
                if (
                    context.steps.some(
                        (step) =>
                            step.message ===
                            "remove division by the same amount",
                    )
                ) {
                    // prevent infinite loop
                    // TODO: determine if this is still needed
                    return FAILED_CHECK;
                }

                const newPrev = Semantic.eq([
                    Semantic.mul([lhsB.args[DENOMINATOR], lhsB]),
                    Semantic.mul([rhsB.args[DENOMINATOR], rhsB]),
                ]);

                const newSteps = [
                    ...context.steps,
                    {
                        message: "remove division by the same amount",
                        nodes: [],
                    },
                ];

                const result = checker.checkStep(newPrev, prev, {
                    ...context,
                    steps: newSteps,
                });
                if (result) {
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message:
                                    "multiply both sides by the same value",
                                nodes: [next, newPrev],
                            },
                            ...result.steps,
                        ],
                    };
                } else {
                    // TODO: write a test case for this
                    return FAILED_CHECK;
                }
            }

            if (result) {
                return {
                    equivalent: true,
                    steps: [
                        {
                            message: "divide both sides by the same value",
                            nodes: [],
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
