import * as Semantic from "@math-blocks/semantic";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

// TODO: create sub-steps that includes the opposite operation when reversed is true
// TODO: include which nodes were added/removed in each reason
// TODO: handle square rooting both sides
// TODO: handle applying the same exponent to both sides

const NUMERATOR = 0;
const DENOMINATOR = 1;

class EquationChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkAddSub(
        a: Semantic.Eq,
        b: Semantic.Eq,
        steps: Step[],
        reversed: boolean,
    ): Result {
        const {checker} = this;

        if (reversed) {
            [a, b] = [b, a];
        }

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsNewTerms = checker.difference(
                Semantic.getTerms(lhsB),
                Semantic.getTerms(lhsA),
                steps,
            );
            const rhsNewTerms = checker.difference(
                Semantic.getTerms(rhsB),
                Semantic.getTerms(rhsA),
                steps,
            );
            // TODO: check thata lhsNew and rhsNew has a single term
            const lhsNew = Semantic.addTerms(lhsNewTerms);
            const rhsNew = Semantic.addTerms(rhsNewTerms);
            const result = checker.checkStep(lhsNew, rhsNew, steps);

            const lhsNewTerm = lhsNewTerms[0];
            const rhsNewTerm = rhsNewTerms[0];

            if (reversed) {
                // This check prevents an infinite loop
                if (
                    steps.some(
                        step =>
                            step.message ===
                            "removing the same term from both sides",
                    )
                ) {
                    return {
                        equivalent: false,
                        steps: [],
                    };
                }

                const prev = b;
                const next = a;
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
                newPrev; // ?

                const newSteps = [
                    ...steps,
                    {
                        message: "removing the same term from both sides",
                        nodes: [],
                    },
                ];

                const result = checker.checkStep(newPrev, next, newSteps);
                if (result.equivalent) {
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message:
                                    "subtract the same value from both sides",
                                nodes: [prev, newPrev],
                            },
                            ...result.steps,
                        ],
                    };
                } else {
                    return {
                        equivalent: false,
                        steps: [],
                    };
                }
            }

            // TODO: handle adding multiple things to lhs and rhs as the same time
            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
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
                            nodes: [],
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

    checkMul(
        a: Semantic.Eq,
        b: Semantic.Eq,
        steps: Step[],
        reversed: boolean,
    ): Result {
        const {checker} = this;

        if (reversed) {
            [a, b] = [b, a];
        }

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsNewFactors = checker.difference(
                Semantic.getFactors(lhsB),
                Semantic.getFactors(lhsA),
                steps,
            );
            const rhsNewFactors = checker.difference(
                Semantic.getFactors(rhsB),
                Semantic.getFactors(rhsA),
                steps,
            );
            const result = checker.checkStep(
                Semantic.mulFactors(lhsNewFactors),
                Semantic.mulFactors(rhsNewFactors),
                steps,
            );

            if (reversed) {
                if (
                    steps.some(
                        step =>
                            step.message ===
                            "remove common factor on both sides",
                    )
                ) {
                    // prevent infinite loop
                    return {
                        equivalent: false,
                        steps: [],
                    };
                }

                const prev = b;
                const next = a;
                const newPrev = Semantic.eq([
                    Semantic.div(lhsB, Semantic.mulFactors(lhsNewFactors)),
                    Semantic.div(rhsB, Semantic.mulFactors(rhsNewFactors)),
                ]);

                const newSteps = [
                    ...steps,
                    {
                        message: "remove common factor on both sides",
                        nodes: [],
                    },
                ];

                const result = checker.checkStep(newPrev, next, newSteps);
                if (result.equivalent) {
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message: "divide both sides by the same value",
                                nodes: [prev, newPrev],
                            },
                            ...result.steps,
                        ],
                    };
                } else {
                    return {
                        equivalent: false,
                        steps: [],
                    };
                }
            }

            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
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
        return {
            equivalent: false,
            steps: [],
        };
    }

    checkDiv(
        a: Semantic.Eq,
        b: Semantic.Eq,
        steps: Step[],
        reversed: boolean,
    ): Result {
        const {checker} = this;

        if (reversed) {
            [a, b] = [b, a];
        }

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "div" && rhsB.type === "div") {
            if (
                checker.checkStep(lhsA, lhsB.args[NUMERATOR], steps)
                    .equivalent &&
                checker.checkStep(rhsA, rhsB.args[NUMERATOR], steps).equivalent
            ) {
                const result = checker.checkStep(
                    lhsB.args[DENOMINATOR],
                    rhsB.args[DENOMINATOR],
                    steps,
                );

                if (reversed) {
                    if (
                        steps.some(
                            step =>
                                step.message ===
                                "remove division by the same amount",
                        )
                    ) {
                        // prevent infinite loop
                        return {
                            equivalent: false,
                            steps: [],
                        };
                    }

                    const prev = b;
                    const next = a;
                    const newPrev = Semantic.eq([
                        Semantic.mul([lhsB.args[DENOMINATOR], lhsB]),
                        Semantic.mul([rhsB.args[DENOMINATOR], rhsB]),
                    ]);

                    const newSteps = [
                        ...steps,
                        {
                            message: "remove division by the same amount",
                            nodes: [],
                        },
                    ];

                    const result = checker.checkStep(newPrev, next, newSteps);
                    if (result.equivalent) {
                        return {
                            equivalent: true,
                            steps: [
                                {
                                    message:
                                        "multiply both sides by the same value",
                                    nodes: [prev, newPrev],
                                },
                                ...result.steps,
                            ],
                        };
                    } else {
                        return {
                            equivalent: false,
                            steps: [],
                        };
                    }
                }

                if (result.equivalent) {
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
        return {
            equivalent: false,
            steps: [],
        };
    }

    runChecks(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        if (a.type !== "eq" || b.type !== "eq") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        let result: Result;

        result = this.checkAddSub(a, b, steps, false);
        if (result.equivalent) {
            return result;
        }

        result = this.checkAddSub(a, b, steps, true);
        if (result.equivalent) {
            return result;
        }

        result = this.checkMul(a, b, steps, false);
        if (result.equivalent) {
            return result;
        }

        result = this.checkMul(a, b, steps, true);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDiv(a, b, steps, false);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDiv(a, b, steps, true);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default EquationChecker;
