import * as Semantic from "@math-blocks/semantic";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

// TODO: create sub-steps that includes the opposite operation when reversed is true
// TODO: include which nodes were added/removed in each reason
// TODO: handle square rooting both sides
// TODO: handle applying the same exponent to both sides

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
            const lhsNew = Semantic.addTerms(lhsNewTerms);
            const rhsNew = Semantic.addTerms(rhsNewTerms);
            const result = checker.checkStep(lhsNew, rhsNew, steps);

            // TODO: handle adding multiple things to lhs and rhs as the same time
            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
                if (
                    Semantic.isSubtraction(lhsNewTerms[0]) &&
                    Semantic.isSubtraction(rhsNewTerms[0])
                ) {
                    const message = reversed
                        ? "removing the same term from both sides"
                        : "subtracting the same value from both sides";
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message,
                                nodes: [],
                            },
                        ],
                    };
                }
                const message = reversed
                    ? "removing the same term from both sides"
                    : "adding the same value to both sides";
                return {
                    equivalent: true,
                    steps: [
                        {
                            message,
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

            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
                const message = reversed
                    ? "remove common factor on both sides"
                    : "multiply both sides by the same value";
                return {
                    equivalent: true,
                    steps: [
                        {
                            message,
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
                checker.checkStep(lhsA, lhsB.args[0], steps).equivalent &&
                checker.checkStep(rhsA, rhsB.args[0], steps).equivalent
            ) {
                if (
                    checker.checkStep(lhsB.args[1], rhsB.args[1], steps)
                        .equivalent
                ) {
                    const message = reversed
                        ? "remove division by the same amount"
                        : "divide both sides by the same value";
                    return {
                        equivalent: true,
                        steps: [
                            {
                                message,
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
